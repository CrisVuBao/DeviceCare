using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface IRepairRepository
    {
        Task<List<Repair>> GetAllRepairAsync();
        Task<List<Repair>> GetFilteredRepairsAsync(string? status, string? search);
        Task<PagedResult<Repair>> GetPagedRepairsAsync(int page, int pageSize, string? status, string? search);
        Task<Repair?> GetRepairWithIdAsync(int id);
        Task<IEnumerable<Repair>> GetRepairByCustomerIdAsync(int customerId);
        Task<IEnumerable<Repair>> GetRepairByNumberPhone(string phoneNumber);
        Task CreateRepairAsync(Repair repair);
        void UpdateRepair(Repair repair);
        void RemoveRepair(Repair repair);
        Task<bool> UploadRepairImageFile(int repairId, string repairImageUrl);
        Task AddStatusHistoryAsync(RepairStatusHistory history);
        Task AddInvoiceAsync(Invoice invoice);
        Task AddWarrantyAsync(Warranty warranty);
    }
}
