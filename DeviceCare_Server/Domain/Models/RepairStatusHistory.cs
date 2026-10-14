using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class RepairStatusHistory
    {
        [Key]
        public int HistoryId { get; set; }

        [ForeignKey("Repair")]
        public int RepairId { get; set; }
        public Repair? Repair { get; set; }

        [Required]
        [MaxLength(20)]
        public string OldStatus { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string NewStatus { get; set; } = string.Empty;

        [ForeignKey("ChangedByUser")]
        public int ChangedByUserId { get; set; }
        public ApplicationUser? ChangedByUser { get; set; }

        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
