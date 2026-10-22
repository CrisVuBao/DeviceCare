using System;

namespace DeviceCare.Application.DTOs.Repair
{
    public class RepairListDto
    {
        public int Id { get; set; }
        public string RepairCode { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
