using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.Contracts.Services;
using DeviceCare.Application.DTOs.Customer;
using DeviceCare.Application.DTOs.Repair;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDateTimeProvider _dateTimeProvider;

        public CustomerService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
        {
            _unitOfWork = unitOfWork;
            _dateTimeProvider = dateTimeProvider;
        }



        public async Task<Response<IEnumerable<CustomerDto>>> GetAllCustomersAsync()
        {
            var customers = await _unitOfWork.Customers.GetAllCustomersAsync();
            var dtos = customers.Select(MapToDto).ToList();
            return Response<IEnumerable<CustomerDto>>.SuccessResult("Lấy danh sách khách hàng thành công", dtos);
        }


        public async Task<Response<CustomerDto>> GetCustomerByIdAsync(int id)
        {
            var customer = await _unitOfWork.Customers.GetCustomerByIdAsync(id);
            if (customer == null)
            {
                return Response<CustomerDto>.Failure("Không tìm thấy khách hàng");
            }

            return Response<CustomerDto>.SuccessResult("Lấy thông tin khách hàng thành công", MapToDto(customer));
        }



        // Tìm khách hàng nhanh bằng số điện thoại
        public async Task<Response<CustomerDto>> FindByPhoneAsync(string phone)
        {
            var customer = await _unitOfWork.Customers.GetCustomerByPhoneNumberAsync(phone);
            if (customer == null)
            {
                return Response<CustomerDto>.Failure("Không tìm thấy khách hàng");
            }

            return Response<CustomerDto>.SuccessResult("Tìm thấy khách hàng", MapToDto(customer));
        }



        //Lấy danh sách lịch sử sửa chữa của một khách hàng
        public async Task<Response<List<RepairListDto>>> GetCustomerRepairsAsync(int id)
        {
            var customer = await _unitOfWork.Customers.GetCustomerByIdAsync(id);
            if (customer == null)
            {
                return Response<List<RepairListDto>>.Failure("Không tìm thấy khách hàng");
            }

            var repairs = customer.Repairs
                .Where(r => !r.IsDeleted)
                .Select(r => new RepairListDto
                {
                    Id = r.RepairId,
                    RepairCode = r.RepairCode,
                    DeviceName = r.DeviceName,
                    CustomerName = customer.FullName,
                    CustomerPhone = customer.PhoneNumber,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                    TotalAmount = r.LaborCost + (r.RepairParts != null ? r.RepairParts.Sum(p => p.Price * p.Quantity) : 0)
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToList();

            return Response<List<RepairListDto>>.SuccessResult("Lấy lịch sử sửa chữa thành công", repairs);
        }


        public async Task<Response<CustomerDto>> CreateCustomerAsync(CreateCustomerDto model)
        {
            var existing = await _unitOfWork.Customers.GetCustomerByPhoneNumberAsync(model.PhoneNumber.Trim());
            if (existing != null)
            {
                return Response<CustomerDto>.Failure("Số điện thoại đã tồn tại trong hệ thống");
            }

            var customer = new Customer
            {
                FullName = model.FullName.Trim(),
                PhoneNumber = model.PhoneNumber.Trim(),
                Address = model.Address?.Trim(),
                Note = model.Note?.Trim(),
                LoyaltyPoints = 0,
                IsDeleted = false,
                CreatedAt = _dateTimeProvider.Now
            };

            await _unitOfWork.Customers.AddCustomerAsync(customer);
            await _unitOfWork.CompleteAsync();

            return Response<CustomerDto>.SuccessResult("Thêm khách hàng thành công", MapToDto(customer));
        }



        public async Task<Response<CustomerDto>> UpdateCustomerAsync(int id, UpdateCustomerDto model)
        {
            var customer = await _unitOfWork.Customers.GetCustomerByIdAsync(id);
            if (customer == null)
            {
                return Response<CustomerDto>.Failure("Không tìm thấy khách hàng");
            }

            var newPhone = model.PhoneNumber.Trim();
            if (customer.PhoneNumber != newPhone)
            {
                var existing = await _unitOfWork.Customers.GetCustomerByPhoneNumberAsync(newPhone);
                if (existing != null && existing.CustomerId != id)
                {
                    return Response<CustomerDto>.Failure("Số điện thoại đã tồn tại cho khách hàng khác");
                }
            }

            customer.FullName = model.FullName.Trim();
            customer.PhoneNumber = newPhone;
            customer.Address = model.Address?.Trim();
            customer.Note = model.Note?.Trim();

            _unitOfWork.Customers.UpdateCustomer(customer);
            await _unitOfWork.CompleteAsync();

            return Response<CustomerDto>.SuccessResult("Cập nhật khách hàng thành công", MapToDto(customer));
        }



        // Xóa mềm khách hàng để bảo toàn dữ liệu lịch sử
        public async Task<Response<string>> DeleteCustomerAsync(int id)
        {
            var customer = await _unitOfWork.Customers.GetCustomerByIdAsync(id);
            if (customer == null)
            {
                return Response<string>.Failure("Không tìm thấy khách hàng");
            }

            customer.IsDeleted = true;
            _unitOfWork.Customers.UpdateCustomer(customer);
            await _unitOfWork.CompleteAsync();

            return Response<string>.SuccessResult("Xóa khách hàng thành công", string.Empty);
        }



        private static CustomerDto MapToDto(Customer customer)
        {
            return new CustomerDto
            {
                CustomerId = customer.CustomerId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                Address = customer.Address,
                Note = customer.Note,
                LoyaltyPoints = customer.LoyaltyPoints,
                CreatedAt = customer.CreatedAt,
                TotalRepairs = customer.Repairs?.Count(r => !r.IsDeleted) ?? 0
            };
        }
    }
}
