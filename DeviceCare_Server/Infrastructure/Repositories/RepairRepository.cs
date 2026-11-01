using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Application.Common;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Domain.Models;
using DeviceCare.Infrastructure.Data;

namespace DeviceCare.Infrastructure.Repositories
{
    public class RepairRepository : IRepairRepository
    {
        private readonly DeviceCareDbContext _dbContext;

        public RepairRepository(DeviceCareDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task CreateRepairAsync(Repair repair)
        {
            await _dbContext.Repairs.AddAsync(repair);
        }

        public async Task<List<Repair>> GetAllRepairAsync()
        {
            return await _dbContext.Repairs
                .AsNoTracking()
                .Where(r => !r.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .Include(r => r.Customer)
                .Include(r => r.Employee)
                    .ThenInclude(e => e!.User)
                .Include(i => i.RepairParts)
                    .ThenInclude(i => i.Inventory)
                .ToListAsync();
        }

        public async Task<List<Repair>> GetFilteredRepairsAsync(string? status, string? search)
        {
            var query = _dbContext.Repairs
                .AsNoTracking()
                .Include(r => r.Customer)
                .Include(r => r.Employee)
                    .ThenInclude(e => e!.User)
                .Include(i => i.RepairParts)
                    .ThenInclude(i => i.Inventory)
                .Where(r => !r.IsDeleted)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                query = query.Where(r =>
                    r.RepairCode.Contains(search) ||
                    r.DeviceName.Contains(search) ||
                    (r.Customer != null && r.Customer.PhoneNumber.Contains(search)) ||
                    (r.Customer != null && r.Customer.FullName.Contains(search)));
            }

            return await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        }

        public async Task<PagedResult<Repair>> GetPagedRepairsAsync(int page, int pageSize, string? status, string? search)
        {
            var query = _dbContext.Repairs
                .AsNoTracking()
                .Include(r => r.Customer)
                .Include(r => r.Employee)
                    .ThenInclude(e => e!.User)
                .Include(i => i.RepairParts)
                    .ThenInclude(i => i.Inventory)
                .Include(r => r.Warranty)
                .Where(r => !r.IsDeleted)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                query = query.Where(r =>
                    r.RepairCode.Contains(search) ||
                    r.DeviceName.Contains(search) ||
                    (r.Customer != null && r.Customer.PhoneNumber.Contains(search)) ||
                    (r.Customer != null && r.Customer.FullName.Contains(search)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<Repair>(items, totalCount, page, pageSize);
        }

        public async Task<IEnumerable<Repair>> GetRepairByCustomerIdAsync(int customerId)
        {
            return await _dbContext.Repairs
                .AsNoTracking()
                .Where(r => r.CustomerId == customerId && !r.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .Include(r => r.Customer)
                .Include(r => r.Warranty)
                .Include(i => i.RepairParts)
                    .ThenInclude(i => i.Inventory)
                .ToListAsync();
        }

        public async Task<IEnumerable<Repair>> GetRepairByNumberPhone(string phoneNumber)
        {
            return await _dbContext.Repairs
                .AsNoTracking()
                .Where(p => p.Customer != null && p.Customer.PhoneNumber == phoneNumber && !p.IsDeleted)
                .Include(r => r.Customer)
                .Include(r => r.StatusHistories)
                .Include(r => r.Warranty)
                .Include(r => r.RepairParts)
                    .ThenInclude(p => p.Inventory)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<Repair?> GetRepairWithIdAsync(int id)
        {
            return await _dbContext.Repairs
                .Include(r => r.Customer)
                .Include(r => r.Employee)
                    .ThenInclude(e => e!.User)
                .Include(r => r.Invoice)
                .Include(r => r.Warranty)
                .Include(r => r.StatusHistories)
                    .ThenInclude(h => h.ChangedByUser)
                .Include(r => r.RepairParts)
                    .ThenInclude(rp => rp.Inventory)
                .FirstOrDefaultAsync(r => r.RepairId == id);
        }

        public void UpdateRepair(Repair repair)
        {
            _dbContext.Repairs.Update(repair);
        }

        public void RemoveRepair(Repair repair)
        {
            _dbContext.Repairs.Remove(repair);
        }

        public async Task<bool> UploadRepairImageFile(int repairId, string repairImageUrl)
        {
            var repair = await GetRepairWithIdAsync(repairId);
            if (repair != null)
            {
                repair.ImageUrl = repairImageUrl;
                await _dbContext.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task AddStatusHistoryAsync(RepairStatusHistory history)
        {
            await _dbContext.RepairStatusHistories.AddAsync(history);
        }

        public async Task AddInvoiceAsync(Invoice invoice)
        {
            await _dbContext.Invoices.AddAsync(invoice);
        }

        public async Task AddWarrantyAsync(Warranty warranty)
        {
            await _dbContext.Warranties.AddAsync(warranty);
        }
    }
}
