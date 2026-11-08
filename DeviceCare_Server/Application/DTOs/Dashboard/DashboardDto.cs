using System.Collections.Generic;

namespace DeviceCare.Application.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        public int TotalPending { get; set; }
        public int TotalCompleted { get; set; }
        public decimal TotalRevenue { get; set; }
        public int NewCustomers { get; set; }

        public List<ChartDataDto> ChartData { get; set; } = new List<ChartDataDto>();
        public List<RecentRepairDto> RecentRepairs { get; set; } = new List<RecentRepairDto>();
        public List<StatusDistributionDto> StatusDistribution { get; set; } = new List<StatusDistributionDto>();
    }

    public class ChartDataDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal DoanhThu { get; set; }
        public int Phieu { get; set; }
    }

    public class RecentRepairDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Device { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
    }

    public class StatusDistributionDto
    {
        public string Status { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
