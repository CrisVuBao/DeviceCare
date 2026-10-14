using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class Warranty
    {
        [Key]
        public int WarrantyId { get; set; }

        [ForeignKey("Repair")]
        public int RepairId { get; set; }
        public Repair? Repair { get; set; }

        public int WarrantyDays { get; set; } = 0;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        [MaxLength(500)]
        public string? Terms { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active"; // Active, Expired, NoWarranty

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
