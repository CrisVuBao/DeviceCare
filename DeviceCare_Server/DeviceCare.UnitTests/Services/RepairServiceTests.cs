using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Xunit;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.Contracts.Services;
using DeviceCare.Application.DTOs.Repair;
using DeviceCare.Application.Services;
using DeviceCare.Domain.Models;

namespace DeviceCare.UnitTests.Services
{
    public class RepairServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IRepairRepository> _mockRepairRepo;
        private readonly Mock<ICustomerRepository> _mockCustomerRepo;
        private readonly Mock<IInventoryRepository> _mockInventoryRepo;
        private readonly Mock<IDateTimeProvider> _mockDateTimeProvider;
        private readonly RepairService _repairService;
        private readonly DateTime _fixedNow;

        public RepairServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockRepairRepo = new Mock<IRepairRepository>();
            _mockCustomerRepo = new Mock<ICustomerRepository>();
            _mockInventoryRepo = new Mock<IInventoryRepository>();
            _mockDateTimeProvider = new Mock<IDateTimeProvider>();

            _mockUnitOfWork.Setup(u => u.Repairs).Returns(_mockRepairRepo.Object);
            _mockUnitOfWork.Setup(u => u.Customers).Returns(_mockCustomerRepo.Object);
            _mockUnitOfWork.Setup(u => u.Inventories).Returns(_mockInventoryRepo.Object);
            _mockUnitOfWork.Setup(u => u.CompleteAsync()).Returns(Task.CompletedTask);

            _fixedNow = new DateTime(2026, 11, 20, 14, 0, 0, DateTimeKind.Local);
            _mockDateTimeProvider.Setup(d => d.Now).Returns(_fixedNow);
            _mockDateTimeProvider.Setup(d => d.UtcNow).Returns(_fixedNow.ToUniversalTime());

            _repairService = new RepairService(_mockUnitOfWork.Object, _mockDateTimeProvider.Object);
        }

        [Fact]
        public async Task GetRepairDetailAsync_WhenRepairExists_ReturnsSuccessWithDetail()
        {
            var repair = new Repair
            {
                RepairId = 1,
                RepairCode = "REP-20261120-001",
                DeviceName = "iPhone 13 Pro",
                Status = "Received"
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(1)).ReturnsAsync(repair);

            var result = await _repairService.GetRepairDetailAsync(1);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data!.RepairCode.Should().Be("REP-20261120-001");
            result.Data.DeviceName.Should().Be("iPhone 13 Pro");
        }

        [Fact]
        public async Task GetRepairDetailAsync_WhenRepairNotFound_ReturnsFailure()
        {
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(999)).ReturnsAsync((Repair?)null);

            var result = await _repairService.GetRepairDetailAsync(999);

            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Be("Không tìm thấy phiếu sửa chữa");
        }

        [Fact]
        public async Task UpdateStatusAsync_WhenSkippingStateFromReceivedToReturned_ReturnsFailure()
        {
            var repair = new Repair
            {
                RepairId = 2,
                RepairCode = "REP-20261120-002",
                Status = "Received"
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(2)).ReturnsAsync(repair);

            var updateModel = new UpdateStatusDto
            {
                NewStatus = "Returned",
                PaymentMethod = "Cash",
                WarrantyDays = 30
            };

            var result = await _repairService.UpdateStatusAsync(2, updateModel);

            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("Không thể chuyển trạng thái từ 'Received' sang 'Returned'");
            repair.Status.Should().Be("Received");
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateStatusAsync_WhenTransitioningFromRepairingToCompleted_SetsCompletedAt()
        {
            var repair = new Repair
            {
                RepairId = 3,
                RepairCode = "REP-20261120-003",
                Status = "Repairing",
                CompletedAt = null
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(3)).ReturnsAsync(repair);

            var updateModel = new UpdateStatusDto
            {
                NewStatus = "Completed",
                Note = "Đã kiểm thử xong máy"
            };

            var result = await _repairService.UpdateStatusAsync(3, updateModel);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            repair.Status.Should().Be("Completed");
            repair.CompletedAt.Should().Be(_fixedNow);
            _mockRepairRepo.Verify(r => r.AddStatusHistoryAsync(It.Is<RepairStatusHistory>(h => h.OldStatus == "Repairing" && h.NewStatus == "Completed")), Times.Once);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task CheckoutAsync_WhenValidCompletedRepair_TransitionsToReturnedAndCreatesInvoiceAndWarranty()
        {
            var customer = new Customer
            {
                CustomerId = 10,
                FullName = "Tran Van B",
                LoyaltyPoints = 2
            };

            var repair = new Repair
            {
                RepairId = 4,
                RepairCode = "REP-20261120-004",
                Status = "Completed",
                LaborCost = 200000m,
                Customer = customer,
                RepairParts = new List<RepairPart>
                {
                    new RepairPart { RepairPartId = 1, Quantity = 2, Price = 150000m }
                }
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(4)).ReturnsAsync(repair);

            var checkoutDto = new CheckoutRepairDto
            {
                PaymentMethod = "Cash",
                WarrantyDays = 30,
                Terms = "Bảo hành 1 đổi 1 trong 30 ngày",
                Note = "Bàn giao khách xong"
            };

            var result = await _repairService.CheckoutAsync(4, checkoutDto);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            repair.Status.Should().Be("Returned");
            repair.ReturnedAt.Should().Be(_fixedNow);

            _mockRepairRepo.Verify(r => r.AddInvoiceAsync(It.Is<Invoice>(i =>
                i.RepairId == 4 &&
                i.InvoiceCode == "HD-REP-20261120-004" &&
                i.Amount == 500000m &&
                i.PaymentMethod == "Cash" &&
                i.IsPaid &&
                i.PaidAt == _fixedNow
            )), Times.Once);

            _mockRepairRepo.Verify(r => r.AddWarrantyAsync(It.Is<Warranty>(w =>
                w.RepairId == 4 &&
                w.WarrantyDays == 30 &&
                w.Status == "Active" &&
                w.StartDate == _fixedNow &&
                w.EndDate == _fixedNow.AddDays(30) &&
                w.Terms == "Bảo hành 1 đổi 1 trong 30 ngày"
            )), Times.Once);

            customer.LoyaltyPoints.Should().Be(3);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task CheckoutAsync_WithZeroWarrantyDays_SetsWarrantyStatusToNoWarranty()
        {
            var repair = new Repair
            {
                RepairId = 5,
                RepairCode = "REP-20261120-005",
                Status = "Completed",
                LaborCost = 100000m
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(5)).ReturnsAsync(repair);

            var checkoutDto = new CheckoutRepairDto
            {
                PaymentMethod = "BankTransfer",
                WarrantyDays = 0,
                Terms = null
            };

            var result = await _repairService.CheckoutAsync(5, checkoutDto);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();

            _mockRepairRepo.Verify(r => r.AddWarrantyAsync(It.Is<Warranty>(w =>
                w.WarrantyDays == 0 &&
                w.Status == "NoWarranty" &&
                w.Terms == "Dịch vụ không áp dụng bảo hành"
            )), Times.Once);
        }

        [Fact]
        public async Task CheckoutAsync_WhenInvoiceAndWarrantyAlreadyExist_DoesNotCreateDuplicates()
        {
            var existingInvoice = new Invoice { InvoiceId = 1, InvoiceCode = "HD-EXISTING", Amount = 100000m };
            var existingWarranty = new Warranty { WarrantyId = 1, WarrantyDays = 30, Status = "Active" };

            var repair = new Repair
            {
                RepairId = 6,
                RepairCode = "REP-20261120-006",
                Status = "Completed",
                LaborCost = 100000m,
                Invoice = existingInvoice,
                Warranty = existingWarranty
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(6)).ReturnsAsync(repair);

            var checkoutDto = new CheckoutRepairDto
            {
                PaymentMethod = "Cash",
                WarrantyDays = 60
            };

            var result = await _repairService.CheckoutAsync(6, checkoutDto);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            _mockRepairRepo.Verify(r => r.AddInvoiceAsync(It.IsAny<Invoice>()), Times.Never);
            _mockRepairRepo.Verify(r => r.AddWarrantyAsync(It.IsAny<Warranty>()), Times.Never);
        }

        [Fact]
        public async Task UpdateStatusAsync_WhenTransitioningToCannotRepair_IsAllowedAndSetsReturnedAt()
        {
            var repair = new Repair
            {
                RepairId = 7,
                RepairCode = "REP-20261120-007",
                Status = "Repairing",
                ReturnedAt = null
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(7)).ReturnsAsync(repair);

            var updateModel = new UpdateStatusDto
            {
                NewStatus = "CannotRepair",
                Note = "Bo mạch chủ chập nguồn không khắc phục được"
            };

            var result = await _repairService.UpdateStatusAsync(7, updateModel);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            repair.Status.Should().Be("CannotRepair");
            repair.ReturnedAt.Should().Be(_fixedNow);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateRepairAsync_WhenValidModel_RecalculatesTotalAmountCorrectly()
        {
            var repair = new Repair
            {
                RepairId = 8,
                DeviceName = "iPad Air 4",
                LaborCost = 150000m,
                TotalAmount = 450000m,
                RepairParts = new List<RepairPart>
                {
                    new RepairPart { RepairPartId = 1, Price = 300000m, Quantity = 1 }
                }
            };
            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(8)).ReturnsAsync(repair);

            var updateDto = new UpdateRepairDto
            {
                DeviceName = "iPad Air 4 Cellular",
                SerialNumber = "DMPZL0XXXXXX",
                ErrorDescription = "Thay pin",
                LaborCost = 250000m,
                Note = "Pin zin bóc máy"
            };

            var result = await _repairService.UpdateRepairAsync(8, updateDto);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            repair.DeviceName.Should().Be("iPad Air 4 Cellular");
            repair.SerialNumber.Should().Be("DMPZL0XXXXXX");
            repair.LaborCost.Should().Be(250000m);
            repair.TotalAmount.Should().Be(550000m);
            _mockRepairRepo.Verify(r => r.UpdateRepair(repair), Times.Once);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateRepairAsync_WhenCustomerDoesNotExist_CreatesCustomerAndRepair()
        {
            _mockCustomerRepo.Setup(c => c.GetCustomerByPhoneNumberAsync("0912345678"))
                .ReturnsAsync((Customer?)null);

            var createDto = new CreateRepairDto
            {
                PhoneNumber = "0912345678",
                CustomerName = "Le Thi C",
                DeviceName = "Samsung Galaxy S22",
                ErrorDescription = "Lỗi chân sạc",
                LaborCost = 180000m
            };

            var result = await _repairService.CreateRepairAsync(createDto);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            _mockCustomerRepo.Verify(c => c.AddCustomerAsync(It.Is<Customer>(cust => cust.PhoneNumber == "0912345678" && cust.FullName == "Le Thi C")), Times.Once);
            _mockRepairRepo.Verify(r => r.CreateRepairAsync(It.Is<Repair>(rep => rep.DeviceName == "Samsung Galaxy S22" && rep.LaborCost == 180000m && rep.Status == "Received")), Times.Once);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.AtLeastOnce);
        }

        [Fact]
        public async Task GetRepairByIdAsync_WithActiveWarranty_CalculatesWarrantyFieldsAndStatusText()
        {
            var warrantyEndDate = _fixedNow.AddDays(45);
            var warranty = new Warranty
            {
                WarrantyId = 20,
                WarrantyDays = 60,
                StartDate = _fixedNow.AddDays(-15),
                EndDate = warrantyEndDate,
                Status = "Active",
                Terms = "Bảo hành linh kiện"
            };

            var repair = new Repair
            {
                RepairId = 9,
                RepairCode = "REP-20261120-009",
                DeviceName = "Xiaomi 13",
                Status = "Returned",
                Warranty = warranty,
                Customer = new Customer { CustomerId = 1, FullName = "Pham D", PhoneNumber = "0900112233" }
            };

            _mockRepairRepo.Setup(r => r.GetRepairWithIdAsync(9)).ReturnsAsync(repair);

            var result = await _repairService.GetRepairDetailDtoAsync(9);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data!.Warranty.Should().NotBeNull();
            result.Data.Warranty!.RemainingDays.Should().Be(45);
            result.Data.Warranty.IsExpired.Should().BeFalse();
            result.Data.Warranty.StatusText.Should().Contain("1 tháng 15 ngày");
        }
    }
}
