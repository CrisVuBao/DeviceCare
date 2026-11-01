using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Infrastructure.Data;

namespace DeviceCare.Infrastructure.Repositories
{
    // Triển khai UnitOfWork quản lý repository
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DeviceCareDbContext _context;
        private ICustomerRepository? _customers;
        private IInventoryRepository? _inventories;
        private IRepairRepository? _repairs;
        private IRepairPartRepository? _repairParts;

        public UnitOfWork(DeviceCareDbContext context)
        {
            _context = context;
        }

        public ICustomerRepository Customers => _customers ??= new CustomerRepository(_context);
        public IInventoryRepository Inventories => _inventories ??= new InventoryRepository(_context);
        public IRepairRepository Repairs => _repairs ??= new RepairRepository(_context);
        public IRepairPartRepository RepairParts => _repairParts ??= new RepairPartRepository(_context);

        public async Task CompleteAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<IDbContextTransaction> BeginTransactionAsync()
        {
            return await _context.Database.BeginTransactionAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
