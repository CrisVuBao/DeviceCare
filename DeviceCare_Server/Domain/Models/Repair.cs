using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class Repair
    {
        [Key]
        public int RepairId { get; set; }

        [Required]
        [MaxLength(20)]
        public string RepairCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Received";

        [ForeignKey("Customer")]
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        [ForeignKey("Employee")]
        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        [Required]
        [MaxLength(150)]
        public string DeviceName { get; set; } = string.Empty;

        public string? ErrorDescription { get; set; }

        public string? Note { get; set; }

        public string? ImageUrl { get; set; }

        public decimal LaborCost { get; set; } = 0;

        public decimal TotalAmount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        public DateTime? ReturnedAt { get; set; }

        public bool IsDeleted { get; set; } = false;

        public ICollection<RepairStatusHistory> StatusHistories { get; set; } = new List<RepairStatusHistory>();
        public ICollection<RepairPart> RepairParts { get; set; } = new List<RepairPart>();
        public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
        public Invoice? Invoice { get; set; }
        public Warranty? Warranty { get; set; }
    }
}
