using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Domain.Models;
using DeviceCare.Infrastructure.Data;

namespace DeviceCare.Infrastructure.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly DeviceCareDbContext _context;

        public CustomerRepository(DeviceCareDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Customer>> GetAllCustomersAsync()
        {
            return await _context.Customers
                .AsNoTracking()
                .Include(c => c.Repairs)
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Customer?> GetCustomerByIdAsync(int customerId)
        {
            return await _context.Customers
                .Include(c => c.Repairs)
                    .ThenInclude(r => r.RepairParts)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId && !c.IsDeleted);
        }

        public async Task<Customer?> GetCustomerByPhoneNumberAsync(string phoneNumber)
        {
            return await _context.Customers
                .Include(c => c.Repairs)
                .FirstOrDefaultAsync(c => c.PhoneNumber == phoneNumber && !c.IsDeleted);
        }

        public async Task AddCustomerAsync(Customer customer)
        {
            await _context.Customers.AddAsync(customer);
        }

        public void UpdateCustomer(Customer customer)
        {
            _context.Customers.Update(customer);
        }

        public void RemoveCustomer(Customer customer)
        {
            _context.Customers.Remove(customer);
        }
    }
}
