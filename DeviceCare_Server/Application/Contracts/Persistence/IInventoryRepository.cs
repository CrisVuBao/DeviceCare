using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface IInventoryRepository
    {
        Task<Inventory?> GetInventoryByIdAsync(int inventoryId);
        Task<IEnumerable<Inventory>> GetAllInventoriesAsync(string? category = null, string? brand = null);
        Task AddInventoryAsync(Inventory inventory);
        void UpdateInventory(Inventory inventory);
        void RemoveInventory(Inventory inventory);

        Task AddTransactionAsync(InventoryTransaction transaction);
        Task<IEnumerable<InventoryTransaction>> GetTransactionsByInventoryIdAsync(int inventoryId);
    }
}
