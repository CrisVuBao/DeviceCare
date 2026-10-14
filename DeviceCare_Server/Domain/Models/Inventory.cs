using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Domain.Models
{
    public class Inventory
    {
        [Key]
        public int InventoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Category { get; set; }

        [MaxLength(50)]
        public string? Brand { get; set; }

        public int Quantity { get; set; } = 0;

        public int MinStock { get; set; } = 3;

        public decimal CostPrice { get; set; } = 0;

        public decimal SellingPrice { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<RepairPart> RepairParts { get; set; } = new List<RepairPart>();
        public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
    }
}
