using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Application.DTOs.Repair
{
    public class CreateRepairDto
    {
        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        public string DeviceName { get; set; } = string.Empty;

        public string? ErrorDescription { get; set; }
        public string? Note { get; set; }
        public decimal LaborCost { get; set; } = 0;
        public int? EmployeeId { get; set; }
        public int? AssignedTechnicianId
        {
            get => EmployeeId;
            set => EmployeeId = value;
        }
    }

    public class UpdateRepairDto
    {
        [Required]
        public string DeviceName { get; set; } = string.Empty;
        public string? ErrorDescription { get; set; }
        public string? Note { get; set; }
        public decimal LaborCost { get; set; }
        public int? EmployeeId { get; set; }
        public int? AssignedTechnicianId
        {
            get => EmployeeId;
            set => EmployeeId = value;
        }
    }

    public class UpdateStatusDto
    {
        [Required]
        public string NewStatus { get; set; } = string.Empty;
        public string? Note { get; set; }
        public int WarrantyDays { get; set; } = 0;
        public string? PaymentMethod { get; set; } = "Cash";
        public string? Terms { get; set; }
    }

    public class CheckoutRepairDto
    {
        public string PaymentMethod { get; set; } = "Cash";
        public int WarrantyDays { get; set; } = 0;
        public string? Terms { get; set; }
        public string? Note { get; set; }
    }

    public class AddRepairPartDto
    {
        [Required]
        public int InventoryId { get; set; }

        [Range(1, 1000)]
        public int Quantity { get; set; } = 1;
    }

    public class RepairDetailDto
    {
        public int RepairId { get; set; }
        public string RepairCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string? ErrorDescription { get; set; }
        public string? Note { get; set; }
        public string? ImageUrl { get; set; }
        public decimal LaborCost { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? ReturnedAt { get; set; }

        public RepairCustomerDto? Customer { get; set; }
        public string? EmployeeName { get; set; }
        public string? ReceiverEmployeeName
        {
            get => EmployeeName;
            set => EmployeeName = value;
        }
        public string? TechnicianName
        {
            get => EmployeeName;
            set => EmployeeName = value;
        }

        public List<RepairPartItemDto> RepairParts { get; set; } = new List<RepairPartItemDto>();
        public List<RepairStatusHistoryItemDto> StatusHistories { get; set; } = new List<RepairStatusHistoryItemDto>();
        public RepairInvoiceDto? Invoice { get; set; }
        public RepairWarrantyDto? Warranty { get; set; }
    }

    public class RepairCustomerDto
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public int LoyaltyPoints { get; set; }
    }

    public class RepairPartItemDto
    {
        public int RepairPartId { get; set; }
        public int InventoryId { get; set; }
        public string InventoryName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class RepairStatusHistoryItemDto
    {
        public int HistoryId { get; set; }
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string? ChangedBy { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RepairInvoiceDto
    {
        public int InvoiceId { get; set; }
        public string InvoiceCode { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public bool IsPaid { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Note { get; set; }
    }

    public class RepairWarrantyDto
    {
        public int WarrantyId { get; set; }
        public int WarrantyDays { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int RemainingDays { get; set; }
        public bool IsExpired { get; set; }
        public string Status { get; set; } = string.Empty;
        public string StatusText { get; set; } = string.Empty;
        public string? Terms { get; set; }
    }

    public class PublicLookupDto
    {
        public string RepairCode { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? ErrorDescription { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? ReturnedAt { get; set; }

        public PublicWarrantyDto? Warranty { get; set; }
        public List<PublicStatusHistoryDto> StatusHistories { get; set; } = new List<PublicStatusHistoryDto>();
    }

    public class PublicWarrantyDto
    {
        public bool HasWarranty { get; set; }
        public int WarrantyDays { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int RemainingDays { get; set; }
        public bool IsExpired { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public string? Terms { get; set; }
    }

    public class PublicStatusHistoryDto
    {
        public string NewStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? Note { get; set; }
    }
}
