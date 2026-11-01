using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Domain.Models;
using DeviceCare.Infrastructure.Data;

namespace DeviceCare.Infrastructure.Repositories
{
    public class RepairPartRepository : IRepairPartRepository
    {
        private readonly DeviceCareDbContext _dbContext;

        public RepairPartRepository(DeviceCareDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<RepairPart?> GetRepairPartByIdAsync(int repairPartId)
        {
            return await _dbContext.RepairParts
                .AsNoTracking()
                .Include(rp => rp.Inventory)
                .FirstOrDefaultAsync(rp => rp.RepairPartId == repairPartId);
        }

        public async Task<IEnumerable<RepairPart>> GetRepairPartsByRepairIdAsync(int repairId)
        {
            return await _dbContext.RepairParts
                .AsNoTracking()
                .Where(rp => rp.RepairId == repairId)
                .Include(rp => rp.Inventory)
                .ToListAsync();
        }

        public async Task AddRepairPartAsync(RepairPart repairPart)
        {
            await _dbContext.RepairParts.AddAsync(repairPart);
        }

        public void UpdateRepairPart(RepairPart repairPart)
        {
            _dbContext.RepairParts.Update(repairPart);
        }

        public void RemoveRepairPart(RepairPart repairPart)
        {
            _dbContext.RepairParts.Remove(repairPart);
        }
    }
}
