using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Domain.Models;
using DeviceCare.Infrastructure.Data;

namespace DeviceCare.Infrastructure.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly DeviceCareDbContext _context;

        public InventoryRepository(DeviceCareDbContext context)
        {
            _context = context;
        }

        public async Task<Inventory?> GetInventoryByIdAsync(int inventoryId)
        {
            return await _context.Inventories
                .Include(i => i.InventoryTransactions)
                    .ThenInclude(t => t.User)
                .Include(i => i.InventoryTransactions)
                    .ThenInclude(t => t.Repair)
                .FirstOrDefaultAsync(i => i.InventoryId == inventoryId);
        }

        public async Task<IEnumerable<Inventory>> GetAllInventoriesAsync(string? category = null, string? brand = null)
        {
            var query = _context.Inventories.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(i => i.Category != null && i.Category.ToLower() == category.ToLower().Trim());
            }

            if (!string.IsNullOrWhiteSpace(brand))
            {
                query = query.Where(i => i.Brand != null && i.Brand.ToLower() == brand.ToLower().Trim());
            }

            return await query
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task AddInventoryAsync(Inventory inventory)
        {
            await _context.Inventories.AddAsync(inventory);
        }

        public void UpdateInventory(Inventory inventory)
        {
            _context.Inventories.Update(inventory);
        }

        public void RemoveInventory(Inventory inventory)
        {
            _context.Inventories.Remove(inventory);
        }

        public async Task AddTransactionAsync(InventoryTransaction transaction)
        {
            await _context.InventoryTransactions.AddAsync(transaction);
        }

        public async Task<IEnumerable<InventoryTransaction>> GetTransactionsByInventoryIdAsync(int inventoryId)
        {
            return await _context.InventoryTransactions
                .AsNoTracking()
                .Include(t => t.User)
                .Include(t => t.Repair)
                .Include(t => t.Inventory)
                .Where(t => t.InventoryId == inventoryId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
    }
}
