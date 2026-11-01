using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface IRepairPartRepository
    {
        Task<RepairPart?> GetRepairPartByIdAsync(int repairPartId);
        Task<IEnumerable<RepairPart>> GetRepairPartsByRepairIdAsync(int repairId);
        Task AddRepairPartAsync(RepairPart repairPart);
        void UpdateRepairPart(RepairPart repairPart);
        void RemoveRepairPart(RepairPart repairPart);
    }
}
