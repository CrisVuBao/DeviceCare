using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class InventoryTransaction
    {
        [Key]
        public int TransactionId { get; set; }

        [ForeignKey("Inventory")]
        public int InventoryId { get; set; }
        public Inventory? Inventory { get; set; }

        [ForeignKey("Repair")]
        public int? RepairId { get; set; }
        public Repair? Repair { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = string.Empty; // Import, Export, Return, Adjust

        public int Quantity { get; set; }

        public int QuantityBefore { get; set; }

        public int QuantityAfter { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
