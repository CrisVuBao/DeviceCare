using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Inventory;

namespace DeviceCare.Application.Services
{
    public interface IInventoryService
    {
        Task<Response<IEnumerable<InventoryDto>>> GetAllInventoriesAsync(bool isAdmin = false, string? category = null, string? brand = null);
        Task<Response<InventoryDto>> GetInventoryByIdAsync(int id, bool isAdmin = false);
        Task<Response<InventoryDto>> CreateInventoryAsync(InventoryCreateUpdateDto dto, int? userId = null);
        Task<Response<InventoryDto>> UpdateInventoryAsync(int id, InventoryCreateUpdateDto dto, int? userId = null);
        Task<Response<string>> ImportStockAsync(int id, ImportInventoryDto dto, int? userId = null);
        Task<Response<IEnumerable<InventoryTransactionDto>>> GetTransactionsAsync(int id);
        Task<Response<string>> DeleteInventoryAsync(int id);
    }
}
