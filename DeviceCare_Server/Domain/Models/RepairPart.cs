using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class RepairPart
    {
        [Key]
        public int RepairPartId { get; set; }

        [ForeignKey("Repair")]
        public int RepairId { get; set; }
        public Repair? Repair { get; set; }

        [ForeignKey("Inventory")]
        public int InventoryId { get; set; }
        public Inventory? Inventory { get; set; }

        public int Quantity { get; set; } = 1;

        public decimal Price { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
