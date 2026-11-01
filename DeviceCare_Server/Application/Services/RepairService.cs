using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.Contracts.Services;
using DeviceCare.Application.DTOs.Repair;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Services
{
    public class RepairService : IRepairService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDateTimeProvider _dateTimeProvider;

        public RepairService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
        {
            _unitOfWork = unitOfWork;
            _dateTimeProvider = dateTimeProvider;
        }

        public async Task<Response<int>> CreateRepairAsync(CreateRepairDto model, int? employeeId = null, int? userId = null)
        {
            var customer = await _unitOfWork.Customers.GetCustomerByPhoneNumberAsync(model.PhoneNumber.Trim());

            if (customer == null)
            {
                customer = new Customer
                {
                    FullName = model.CustomerName.Trim(),
                    PhoneNumber = model.PhoneNumber.Trim(),
                    CreatedAt = _dateTimeProvider.Now
                };
                await _unitOfWork.Customers.AddCustomerAsync(customer);
                await _unitOfWork.CompleteAsync();
            }

            var repair = new Repair
            {
                RepairCode = "REP-" + _dateTimeProvider.Now.ToString("yyyyMMdd") + "-" + new Random().Next(100, 999).ToString(),
                Status = "Received",
                DeviceName = model.DeviceName.Trim(),
                ErrorDescription = model.ErrorDescription?.Trim(),
                Note = model.Note?.Trim(),
                LaborCost = model.LaborCost,
                TotalAmount = model.LaborCost,
                CustomerId = customer.CustomerId,
                EmployeeId = model.EmployeeId ?? employeeId,
                CreatedAt = _dateTimeProvider.Now
            };

            await _unitOfWork.Repairs.CreateRepairAsync(repair);
            await _unitOfWork.CompleteAsync();

            // Tự động tạo bản ghi đầu tiên trong RepairStatusHistories
            var initialHistory = new RepairStatusHistory
            {
                RepairId = repair.RepairId,
                OldStatus = "None",
                NewStatus = "Received",
                ChangedByUserId = userId ?? 1,
                Note = "Tiếp nhận thiết bị tại quầy",
                CreatedAt = _dateTimeProvider.Now
            };
            await _unitOfWork.Repairs.AddStatusHistoryAsync(initialHistory);
            await _unitOfWork.CompleteAsync();

            return Response<int>.SuccessResult("Tạo phiếu sửa chữa thành công", repair.RepairId);
        }

        public async Task<Response<List<RepairListDto>>> GetAllRepairsAsync(string? status, string? search)
        {
            var repairs = await _unitOfWork.Repairs.GetFilteredRepairsAsync(status, search);

            var result = repairs.Select(r => new RepairListDto
            {
                Id = r.RepairId,
                RepairCode = r.RepairCode,
                DeviceName = r.DeviceName,
                CustomerName = r.Customer?.FullName ?? "Unknown",
                CustomerPhone = r.Customer?.PhoneNumber ?? "Unknown",
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                TotalAmount = r.LaborCost + (r.RepairParts != null ? r.RepairParts.Sum(p => p.Price * p.Quantity) : 0)
            }).ToList();

            return Response<List<RepairListDto>>.SuccessResult("Lấy danh sách thành công", result);
        }

        public async Task<Response<PagedResult<RepairListDto>>> GetPagedRepairsAsync(int page, int pageSize, string? status, string? search)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 20;

            var pagedData = await _unitOfWork.Repairs.GetPagedRepairsAsync(page, pageSize, status, search);

            var dtos = pagedData.Items.Select(r => new RepairListDto
            {
                Id = r.RepairId,
                RepairCode = r.RepairCode,
                DeviceName = r.DeviceName,
                CustomerName = r.Customer?.FullName ?? "Unknown",
                CustomerPhone = r.Customer?.PhoneNumber ?? "Unknown",
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                TotalAmount = r.LaborCost + (r.RepairParts != null ? r.RepairParts.Sum(p => p.Price * p.Quantity) : 0)
            }).ToList();

            var result = new PagedResult<RepairListDto>(dtos, pagedData.TotalCount, pagedData.Page, pagedData.PageSize);
            return Response<PagedResult<RepairListDto>>.SuccessResult("Lấy danh sách phân trang thành công", result);
        }

        public async Task<Response<RepairDetailDto>> GetRepairDetailDtoAsync(int id)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null)
            {
                return Response<RepairDetailDto>.Failure("Không tìm thấy phiếu sửa chữa");
            }

            var dto = new RepairDetailDto
            {
                RepairId = repair.RepairId,
                RepairCode = repair.RepairCode,
                Status = repair.Status,
                DeviceName = repair.DeviceName,
                ErrorDescription = repair.ErrorDescription,
                Note = repair.Note,
                ImageUrl = repair.ImageUrl,
                LaborCost = repair.LaborCost,
                TotalAmount = repair.LaborCost + (repair.RepairParts != null ? repair.RepairParts.Sum(p => p.Price * p.Quantity) : 0),
                CreatedAt = repair.CreatedAt,
                CompletedAt = repair.CompletedAt,
                ReturnedAt = repair.ReturnedAt,
                EmployeeName = repair.Employee?.User?.FullName ?? repair.Employee?.Position,
                Customer = repair.Customer == null ? null : new RepairCustomerDto
                {
                    CustomerId = repair.Customer.CustomerId,
                    FullName = repair.Customer.FullName,
                    PhoneNumber = repair.Customer.PhoneNumber,
                    Address = repair.Customer.Address,
                    LoyaltyPoints = repair.Customer.LoyaltyPoints
                },
                RepairParts = (repair.RepairParts ?? Enumerable.Empty<RepairPart>()).Select(rp => new RepairPartItemDto
                {
                    RepairPartId = rp.RepairPartId,
                    InventoryId = rp.InventoryId,
                    InventoryName = rp.Inventory?.Name ?? "Linh kiện",
                    Quantity = rp.Quantity,
                    Price = rp.Price
                }).ToList(),
                StatusHistories = (repair.StatusHistories ?? Enumerable.Empty<RepairStatusHistory>()).OrderBy(h => h.CreatedAt).Select(h => new RepairStatusHistoryItemDto
                {
                    HistoryId = h.HistoryId,
                    OldStatus = h.OldStatus,
                    NewStatus = h.NewStatus,
                    ChangedBy = h.ChangedByUser?.FullName ?? "Hệ thống",
                    Note = h.Note,
                    CreatedAt = h.CreatedAt
                }).ToList()
            };

            if (repair.Invoice != null)
            {
                dto.Invoice = new RepairInvoiceDto
                {
                    InvoiceId = repair.Invoice.InvoiceId,
                    InvoiceCode = repair.Invoice.InvoiceCode,
                    Amount = repair.Invoice.Amount,
                    PaymentMethod = repair.Invoice.PaymentMethod,
                    IsPaid = repair.Invoice.IsPaid,
                    PaidAt = repair.Invoice.PaidAt,
                    Note = repair.Invoice.Note
                };
            }

            if (repair.Warranty != null)
            {
                int remainingDays = Math.Max(0, (repair.Warranty.EndDate.Date - DateTime.UtcNow.Date).Days);
                bool isExpired = remainingDays <= 0 && repair.Warranty.WarrantyDays > 0;
                string statusText = FormatWarrantyStatusText(repair.Warranty.WarrantyDays, remainingDays);

                dto.Warranty = new RepairWarrantyDto
                {
                    WarrantyId = repair.Warranty.WarrantyId,
                    WarrantyDays = repair.Warranty.WarrantyDays,
                    StartDate = repair.Warranty.StartDate,
                    EndDate = repair.Warranty.EndDate,
                    RemainingDays = remainingDays,
                    IsExpired = isExpired,
                    Status = repair.Warranty.Status,
                    StatusText = statusText,
                    Terms = repair.Warranty.Terms
                };
            }

            return Response<RepairDetailDto>.SuccessResult("Lấy chi tiết thành công", dto);
        }

        public async Task<Response<Repair>> GetRepairDetailAsync(int id)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null)
            {
                return Response<Repair>.Failure("Không tìm thấy phiếu sửa chữa");
            }
            return Response<Repair>.SuccessResult("Lấy chi tiết thành công", repair);
        }

        public async Task<Response<string>> UpdateRepairAsync(int id, UpdateRepairDto model)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null)
            {
                return Response<string>.Failure("Không tìm thấy phiếu sửa chữa");
            }

            repair.DeviceName = model.DeviceName.Trim();
            repair.ErrorDescription = model.ErrorDescription?.Trim();
            repair.Note = model.Note?.Trim();
            repair.LaborCost = model.LaborCost;
            if (model.EmployeeId.HasValue)
            {
                repair.EmployeeId = model.EmployeeId.Value;
            }

            repair.TotalAmount = repair.LaborCost + (repair.RepairParts != null ? repair.RepairParts.Sum(p => p.Price * p.Quantity) : 0);

            _unitOfWork.Repairs.UpdateRepair(repair);
            await _unitOfWork.CompleteAsync();

            return Response<string>.SuccessResult("Cập nhật thành công", "Success");
        }

        public async Task<Response<string>> UpdateStatusAsync(int id, UpdateStatusDto model, int? userId = null)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null)
            {
                return Response<string>.Failure("Không tìm thấy phiếu sửa chữa");
            }

            string current = repair.Status;
            string target = model.NewStatus;

            // Kiểm tra quy tắc chuyển trạng thái
            bool isValid = IsValidTransition(current, target);
            if (!isValid)
            {
                return Response<string>.Failure($"Không thể chuyển trạng thái từ '{current}' sang '{target}'! Quy trình phải tuân thủ từng bước");
            }

            repair.Status = target;

            if (target == "Completed")
            {
                repair.CompletedAt = _dateTimeProvider.Now;
            }
            else if (target == "Returned")
            {
                repair.ReturnedAt = _dateTimeProvider.Now;
                if (repair.CompletedAt == null)
                {   
                    repair.CompletedAt = repair.ReturnedAt;
                }

                // Tự động sinh Hóa đơn nếu chưa có
                if (repair.Invoice == null)
                {
                    var invoice = new Invoice
                    {
                        RepairId = repair.RepairId,
                        InvoiceCode = "HD-" + repair.RepairCode,
                        Amount = repair.LaborCost + (repair.RepairParts != null ? repair.RepairParts.Sum(p => p.Price * p.Quantity) : 0),
                        PaymentMethod = model.PaymentMethod ?? "Cash",
                        IsPaid = true,
                        PaidAt = _dateTimeProvider.Now,
                        Note = "Hóa đơn thanh toán bàn giao thiết bị",
                        CreatedAt = _dateTimeProvider.Now
                    };
                    await _unitOfWork.Repairs.AddInvoiceAsync(invoice);
                }

                // Tự động sinh bảo hành nếu chưa có
                if (repair.Warranty == null)
                {
                    int days = model.WarrantyDays;
                    var warranty = new Warranty
                    {
                        RepairId = repair.RepairId,
                        WarrantyDays = days,
                        StartDate = _dateTimeProvider.Now,
                        EndDate = _dateTimeProvider.Now.AddDays(days),
                        Status = days > 0 ? "Active" : "NoWarranty",
                        Terms = !string.IsNullOrWhiteSpace(model.Terms)
                            ? model.Terms
                            : (days > 0 ? "Bảo hành dịch vụ sửa chữa theo quy định của cửa hàng" : "Dịch vụ không áp dụng bảo hành"),
                        CreatedAt = _dateTimeProvider.Now
                    };
                    await _unitOfWork.Repairs.AddWarrantyAsync(warranty);
                }

                if (repair.Customer != null)
                {
                    repair.Customer.LoyaltyPoints += 1;
                }
            }
            else if (target == "CannotRepair")
            {
                repair.ReturnedAt = _dateTimeProvider.Now;
            }

            var history = new RepairStatusHistory
            {
                RepairId = repair.RepairId,
                OldStatus = current,
                NewStatus = target,
                ChangedByUserId = userId ?? 1,
                Note = model.Note,
                CreatedAt = _dateTimeProvider.Now
            };
            await _unitOfWork.Repairs.AddStatusHistoryAsync(history);

            _unitOfWork.Repairs.UpdateRepair(repair);
            await _unitOfWork.CompleteAsync();

            return Response<string>.SuccessResult("Cập nhật trạng thái thành công", repair.Status);
        }

        private bool IsValidTransition(string current, string target)
        {
            if (target == "CannotRepair" || target == "Cancelled")
            {
                return current != "Returned" && current != "CannotRepair" && current != "Cancelled";
            }

            return current switch
            {
                "Received" => target == "Quoted" || target == "Diagnosed",
                "Diagnosed" => target == "Quoted" || target == "Approved",
                "Quoted" => target == "Approved" || target == "Repairing",
                "Approved" => target == "Repairing",
                "Repairing" => target == "Completed",
                "Completed" => target == "ReadyForPickup" || target == "Returned",
                "ReadyForPickup" => target == "Returned",
                _ => false
            };
        }

        public async Task<Response<string>> CheckoutAsync(int id, CheckoutRepairDto dto, int? userId = null)
        {
            var updateModel = new UpdateStatusDto
            {
                NewStatus = "Returned",
                PaymentMethod = dto.PaymentMethod,
                WarrantyDays = dto.WarrantyDays,
                Terms = dto.Terms,
                Note = dto.Note ?? "Bàn giao thiết bị và thanh toán tại quầy"
            };

            return await UpdateStatusAsync(id, updateModel, userId);
        }

        public async Task<Response<string>> DeleteRepairAsync(int id)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null)
            {
                return Response<string>.Failure("Không tìm thấy phiếu sửa chữa");
            }

            repair.IsDeleted = true;
            _unitOfWork.Repairs.UpdateRepair(repair);
            await _unitOfWork.CompleteAsync();

            return Response<string>.SuccessResult("Xóa phiếu thành công", "Success");
        }

        public async Task<Response<List<PublicLookupDto>>> LookupByPhoneAsync(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return Response<List<PublicLookupDto>>.Failure("Vui lòng nhập số điện thoại");

            string cleanPhone = phone.Trim().Replace(" ", "");
            var repairs = await _unitOfWork.Repairs.GetRepairByNumberPhone(cleanPhone);

            if (!repairs.Any())
                return Response<List<PublicLookupDto>>.Failure("Không tìm thấy phiếu sửa chữa nào cho số điện thoại này");

            var result = repairs.Select(r =>
            {
                var lookup = new PublicLookupDto
                {
                    RepairCode = r.RepairCode,
                    DeviceName = r.DeviceName,
                    CustomerName = r.Customer?.FullName ?? "Khách hàng",
                    ErrorDescription = r.ErrorDescription,
                    Status = r.Status,
                    TotalAmount = r.LaborCost + (r.RepairParts != null ? r.RepairParts.Sum(p => p.Price * p.Quantity) : 0),
                    CreatedAt = r.CreatedAt,
                    CompletedAt = r.CompletedAt,
                    ReturnedAt = r.ReturnedAt,
                    StatusHistories = (r.StatusHistories ?? Enumerable.Empty<RepairStatusHistory>()).OrderBy(h => h.CreatedAt).Select(h => new PublicStatusHistoryDto
                    {
                        NewStatus = h.NewStatus,
                        CreatedAt = h.CreatedAt,
                        Note = h.Note
                    }).ToList()
                };

                if (r.Warranty != null)
                {
                    int remainingDays = Math.Max(0, (r.Warranty.EndDate.Date - DateTime.UtcNow.Date).Days);
                    bool isExpired = remainingDays <= 0 && r.Warranty.WarrantyDays > 0;
                    string statusText = FormatWarrantyStatusText(r.Warranty.WarrantyDays, remainingDays);

                    lookup.Warranty = new PublicWarrantyDto
                    {
                        HasWarranty = r.Warranty.WarrantyDays > 0,
                        WarrantyDays = r.Warranty.WarrantyDays,
                        StartDate = r.Warranty.StartDate,
                        EndDate = r.Warranty.EndDate,
                        RemainingDays = remainingDays,
                        IsExpired = isExpired,
                        StatusText = statusText,
                        Terms = r.Warranty.Terms
                    };
                }

                return lookup;
            }).OrderByDescending(r => r.CreatedAt).ToList();

            return Response<List<PublicLookupDto>>.SuccessResult($"Tìm thấy {result.Count} lịch sử sửa chữa", result);
        }

        public async Task<Response<string>> AddRepairPartAsync(int id, AddRepairPartDto dto, int? userId = null)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null) return Response<string>.Failure("Không tìm thấy phiếu sửa chữa");

            var inventory = await _unitOfWork.Inventories.GetInventoryByIdAsync(dto.InventoryId);
            if (inventory == null) return Response<string>.Failure("Không tìm thấy linh kiện trong kho");
            if (inventory.Quantity < dto.Quantity) return Response<string>.Failure("Kho không đủ số lượng linh kiện này");

            using var transaction = await _unitOfWork.BeginTransactionAsync();
            try
            {
                int oldQty = inventory.Quantity;
                inventory.Quantity -= dto.Quantity;
                _unitOfWork.Inventories.UpdateInventory(inventory);

                var part = new RepairPart
                {
                    RepairId = id,
                    InventoryId = dto.InventoryId,
                    Quantity = dto.Quantity,
                    Price = inventory.SellingPrice,
                    CreatedAt = _dateTimeProvider.Now
                };
                await _unitOfWork.RepairParts.AddRepairPartAsync(part);

                var invTx = new InventoryTransaction
                {
                    InventoryId = dto.InventoryId,
                    RepairId = id,
                    UserId = userId ?? 1,
                    Type = "Export",
                    Quantity = -dto.Quantity,
                    QuantityBefore = oldQty,
                    QuantityAfter = inventory.Quantity,
                    Reason = $"Thay thế linh kiện cho phiếu {repair.RepairCode}",
                    CreatedAt = _dateTimeProvider.Now
                };
                await _unitOfWork.Inventories.AddTransactionAsync(invTx);

                repair.TotalAmount = repair.LaborCost + (repair.RepairParts != null ? repair.RepairParts.Sum(p => p.Price * p.Quantity) : 0) + (part.Price * part.Quantity);
                _unitOfWork.Repairs.UpdateRepair(repair);

                await _unitOfWork.CompleteAsync();
                await transaction.CommitAsync();

                return Response<string>.SuccessResult("Thêm linh kiện thành công", string.Empty);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Response<string>.Failure("Lỗi khi thêm linh kiện: " + ex.Message);
            }
        }

        public async Task<Response<string>> RemoveRepairPartAsync(int id, int partId, int? userId = null)
        {
            var repair = await _unitOfWork.Repairs.GetRepairWithIdAsync(id);
            if (repair == null) return Response<string>.Failure("Không tìm thấy phiếu sửa chữa");

            var part = await _unitOfWork.RepairParts.GetRepairPartByIdAsync(partId);
            if (part == null || part.RepairId != id) return Response<string>.Failure("Không tìm thấy chi tiết linh kiện này trong phiếu");

            using var transaction = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var inventory = await _unitOfWork.Inventories.GetInventoryByIdAsync(part.InventoryId);
                if (inventory != null)
                {
                    int oldQty = inventory.Quantity;
                    inventory.Quantity += part.Quantity;
                    _unitOfWork.Inventories.UpdateInventory(inventory);

                    var invTx = new InventoryTransaction
                    {
                        InventoryId = part.InventoryId,
                        RepairId = id,
                        UserId = userId ?? 1,
                        Type = "Return",
                        Quantity = part.Quantity,
                        QuantityBefore = oldQty,
                        QuantityAfter = inventory.Quantity,
                        Reason = $"Tháo linh kiện hoàn kho từ phiếu {repair.RepairCode}",
                        CreatedAt = _dateTimeProvider.Now
                    };
                    await _unitOfWork.Inventories.AddTransactionAsync(invTx);
                }

                _unitOfWork.RepairParts.RemoveRepairPart(part);
                await _unitOfWork.CompleteAsync();

                repair.TotalAmount = repair.LaborCost + (repair.RepairParts != null ? repair.RepairParts.Where(p => p.RepairPartId != partId).Sum(p => p.Price * p.Quantity) : 0);
                _unitOfWork.Repairs.UpdateRepair(repair);
                await _unitOfWork.CompleteAsync();

                await transaction.CommitAsync();

                return Response<string>.SuccessResult("Xóa linh kiện khỏi phiếu và hoàn kho thành công", string.Empty);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Response<string>.Failure("Lỗi khi xóa linh kiện: " + ex.Message);
            }
        }

        private static string FormatWarrantyStatusText(int warrantyDays, int remainingDays)
        {
            if (warrantyDays <= 0) return "Dịch vụ không áp dụng bảo hành";
            if (remainingDays <= 0) return "Hết hạn bảo hành";

            if (remainingDays >= 365)
            {
                int years = remainingDays / 365;
                int months = (remainingDays % 365) / 30;
                if (months > 0)
                    return $"Còn bảo hành {years} năm {months} tháng ({remainingDays} ngày)";
                return $"Còn bảo hành {years} năm ({remainingDays} ngày)";
            }

            if (remainingDays >= 30)
            {
                int months = remainingDays / 30;
                int days = remainingDays % 30;
                if (days > 0)
                    return $"Còn bảo hành {months} tháng {days} ngày ({remainingDays} ngày)";
                return $"Còn bảo hành {months} tháng ({remainingDays} ngày)";
            }

            return $"Còn bảo hành {remainingDays} ngày";
        }
    }
}
