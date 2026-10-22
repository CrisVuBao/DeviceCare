using System;
using System.Threading.Tasks;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface IUnitOfWork : IDisposable
    {
        ICustomerRepository Customers { get; }
        IInventoryRepository Inventories { get; }

        Task CompleteAsync();
    }
}
