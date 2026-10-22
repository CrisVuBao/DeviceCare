using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Customer;
using DeviceCare.Application.DTOs.Repair;

namespace DeviceCare.Application.Services
{
    public interface ICustomerService
    {
        Task<Response<IEnumerable<CustomerDto>>> GetAllCustomersAsync();
        Task<Response<CustomerDto>> GetCustomerByIdAsync(int id);
        Task<Response<CustomerDto>> FindByPhoneAsync(string phone);
        Task<Response<List<RepairListDto>>> GetCustomerRepairsAsync(int id);
        Task<Response<CustomerDto>> CreateCustomerAsync(CreateCustomerDto model);
        Task<Response<CustomerDto>> UpdateCustomerAsync(int id, UpdateCustomerDto model);
        Task<Response<string>> DeleteCustomerAsync(int id);
    }
}
