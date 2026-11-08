using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.Contracts.Services;
using DeviceCare.Application.DTOs.Dashboard;
using DeviceCare.Domain.Models;
using DeviceCare.Infrastructure.Data;

namespace DeviceCare.Infrastructure.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly DeviceCareDbContext _context;
        private readonly IDateTimeProvider _dateTimeProvider;

        public DashboardRepository(DeviceCareDbContext context, IDateTimeProvider dateTimeProvider)
        {
            _context = context;
            _dateTimeProvider = dateTimeProvider;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string period)
        {
            var now = _dateTimeProvider.Now;
            var result = new DashboardSummaryDto();

            var repairs = await _context.Repairs
                .AsNoTracking()
                .Include(r => r.Customer)
                .Include(r => r.Invoice)
                .Include(r => r.RepairParts)
                .Where(r => !r.IsDeleted)
                .ToListAsync();

            var customers = await _context.Customers
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .ToListAsync();

            result.TotalPending = repairs.Count(r => r.Status == "Received" || r.Status == "Quoted" || r.Status == "Repairing");
            result.TotalCompleted = repairs.Count(r => r.Status == "Completed" || r.Status == "Returned");
            result.TotalRevenue = repairs.Sum(GetRepairRevenue);
            result.NewCustomers = customers.Count;

            var chartDataList = new List<ChartDataDto>();

            if (period == "month")
            {
                int daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
                for (int i = 1; i <= daysInMonth; i++)
                {
                    var day = new DateTime(now.Year, now.Month, i);
                    var dailyRepairs = repairs.Where(r => r.CreatedAt.Date == day.Date).ToList();

                    chartDataList.Add(new ChartDataDto
                    {
                        Name = $"N{i}",
                        DoanhThu = dailyRepairs.Sum(GetRepairRevenue),
                        Phieu = dailyRepairs.Count
                    });
                }
            }
            else if (period == "year")
            {
                for (int i = 1; i <= 12; i++)
                {
                    var monthlyRepairs = repairs.Where(r => r.CreatedAt.Year == now.Year && r.CreatedAt.Month == i).ToList();

                    chartDataList.Add(new ChartDataDto
                    {
                        Name = $"T{i}",
                        DoanhThu = monthlyRepairs.Sum(GetRepairRevenue),
                        Phieu = monthlyRepairs.Count
                    });
                }
            }
            else
            {
                int diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
                var startOfWeek = now.Date.AddDays(-1 * diff);

                for (int i = 0; i < 7; i++)
                {
                    var day = startOfWeek.AddDays(i);
                    var dailyRepairs = repairs.Where(r => r.CreatedAt.Date == day.Date).ToList();

                    string dayName = day.DayOfWeek switch
                    {
                        DayOfWeek.Monday => "T2",
                        DayOfWeek.Tuesday => "T3",
                        DayOfWeek.Wednesday => "T4",
                        DayOfWeek.Thursday => "T5",
                        DayOfWeek.Friday => "T6",
                        DayOfWeek.Saturday => "T7",
                        DayOfWeek.Sunday => "CN",
                        _ => day.ToString("dd/MM")
                    };

                    chartDataList.Add(new ChartDataDto
                    {
                        Name = dayName,
                        DoanhThu = dailyRepairs.Sum(GetRepairRevenue),
                        Phieu = dailyRepairs.Count
                    });
                }
            }

            result.ChartData = chartDataList;

            result.RecentRepairs = repairs
                .OrderByDescending(r => r.CreatedAt)
                .Take(6)
                .Select(r => new RecentRepairDto
                {
                    Id = r.RepairId,
                    Code = r.RepairCode,
                    Device = r.DeviceName,
                    Status = r.Status,
                    Customer = r.Customer?.FullName ?? "Khách vãng lai",
                    Time = GetTimeAgo(r.CreatedAt, now),
                    TotalAmount = r.TotalAmount > 0 ? r.TotalAmount : GetRepairRevenue(r)
                })
                .ToList();

            var statusLabels = new Dictionary<string, string>
            {
                { "Received", "Mới tiếp nhận" },
                { "Quoted", "Đã báo giá" },
                { "Repairing", "Đang sửa chữa" },
                { "Completed", "Đã sửa xong" },
                { "Returned", "Đã bàn giao khách" },
                { "CannotRepair", "Không sửa được" },
                { "Cancelled", "Đã hủy phiếu" }
            };

            result.StatusDistribution = statusLabels.Select(kv => new StatusDistributionDto
            {
                Status = kv.Key,
                Label = kv.Value,
                Count = repairs.Count(r => r.Status == kv.Key)
            }).ToList();

            return result;
        }

        private static decimal GetRepairRevenue(Repair r)
        {
            if (r.Invoice != null && r.Invoice.IsPaid)
            {
                return r.Invoice.Amount;
            }

            if (r.Status == "Returned")
            {
                if (r.TotalAmount > 0)
                {
                    return r.TotalAmount;
                }

                decimal partsSum = r.RepairParts != null ? r.RepairParts.Sum(p => p.Price * p.Quantity) : 0;
                return r.LaborCost + partsSum;
            }

            return 0;
        }

        private static string GetTimeAgo(DateTime pastDate, DateTime currentDate)
        {
            var ts = currentDate - pastDate;

            if (ts.TotalMinutes < 1)
            {
                return "Vừa xong";
            }
            if (ts.TotalMinutes < 60)
            {
                return $"{(int)ts.TotalMinutes} phút trước";
            }
            if (ts.TotalHours < 24)
            {
                return $"{(int)ts.TotalHours} giờ trước";
            }
            if (ts.TotalDays < 30)
            {
                return $"{(int)ts.TotalDays} ngày trước";
            }

            return pastDate.ToString("dd/MM/yyyy");
        }
    }
}
