using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface ICustomerRepository
    {
        Task<IEnumerable<Customer>> GetAllCustomersAsync();
        Task<Customer?> GetCustomerByIdAsync(int customerId);
        Task<Customer?> GetCustomerByPhoneNumberAsync(string phoneNumber);
        Task AddCustomerAsync(Customer customer);
        void UpdateCustomer(Customer customer);
        void RemoveCustomer(Customer customer);
    }
}
