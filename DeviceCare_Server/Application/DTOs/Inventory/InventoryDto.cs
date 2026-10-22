using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Application.DTOs.Inventory
{
    public class InventoryDto
    {
        public int InventoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public int Quantity { get; set; }
        public int MinStock { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<InventoryTransactionDto>? Transactions { get; set; }
    }




    public class InventoryCreateUpdateDto
    {
        [Required(ErrorMessage = "Tên linh kiện là bắt buộc")]
        [MaxLength(100, ErrorMessage = "Tên linh kiện không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(50, ErrorMessage = "Phân loại linh kiện không được vượt quá 50 ký tự")]
        public string? Category { get; set; }

        [MaxLength(50, ErrorMessage = "Hãng không được vượt quá 50 ký tự")]
        public string? Brand { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn hoặc bằng 0")]
        public int Quantity { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Mức tồn kho tối thiểu phải lớn hơn hoặc bằng 0")]
        public int MinStock { get; set; } = 3;

        [Range(0, double.MaxValue, ErrorMessage = "Giá nhập phải lớn hơn hoặc bằng 0")]
        public decimal CostPrice { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        public decimal SellingPrice { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }



    // Yêu cầu nhập thêm linh kiện vào kho
    public class ImportInventoryDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng nhập phải lớn hơn 0")]
        public int Quantity { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá nhập phải lớn hơn hoặc bằng 0")]
        public decimal? CostPrice { get; set; }

        [MaxLength(500, ErrorMessage = "Lý do nhập kho không được vượt quá 500 ký tự")]
        public string? Reason { get; set; }
    }


    //Lịch sử biến động xuất nhập tồn của linh kiện
    public class InventoryTransactionDto
    {
        public int TransactionId { get; set; }
        public int InventoryId { get; set; }
        public string? PartName { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int QuantityBefore { get; set; }
        public int QuantityAfter { get; set; }
        public string? Reason { get; set; }
        public string? RepairCode { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
