using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface IUnitOfWork : IDisposable
    {
        ICustomerRepository Customers { get; }
        IInventoryRepository Inventories { get; }
        IRepairRepository Repairs { get; }
        IRepairPartRepository RepairParts { get; }

        Task CompleteAsync();
        Task<IDbContextTransaction> BeginTransactionAsync();
    }
}
