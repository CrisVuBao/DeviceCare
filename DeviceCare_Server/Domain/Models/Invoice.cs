using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class Invoice
    {
        [Key]
        public int InvoiceId { get; set; }

        [Required]
        [MaxLength(20)]
        public string InvoiceCode { get; set; } = string.Empty;

        [ForeignKey("Repair")]
        public int RepairId { get; set; }
        public Repair? Repair { get; set; }

        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string PaymentMethod { get; set; } = "Cash"; // Cash, Transfer

        public bool IsPaid { get; set; } = true;

        public DateTime PaidAt { get; set; } = DateTime.UtcNow;

        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
