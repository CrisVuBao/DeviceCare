using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.Contracts.Services;
using DeviceCare.Application.DTOs.Inventory;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDateTimeProvider _dateTimeProvider;

        public InventoryService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
        {
            _unitOfWork = unitOfWork;
            _dateTimeProvider = dateTimeProvider;
        }

        public async Task<Response<IEnumerable<InventoryDto>>> GetAllInventoriesAsync(bool isAdmin = false, string? category = null, string? brand = null)
        {
            var inventories = await _unitOfWork.Inventories.GetAllInventoriesAsync(category, brand);
            var dtos = inventories.Select(i => MapToDto(i, isAdmin)).ToList();
            return Response<IEnumerable<InventoryDto>>.SuccessResult("Lấy danh sách linh kiện thành công", dtos);
        }

        public async Task<Response<InventoryDto>> GetInventoryByIdAsync(int id, bool isAdmin = false)
        {
            var inventory = await _unitOfWork.Inventories.GetInventoryByIdAsync(id);
            if (inventory == null)
            {
                return Response<InventoryDto>.Failure("Không tìm thấy linh kiện");
            }

            var dto = MapToDto(inventory, isAdmin);

            // Nạp lịch sử biến động kho nếu có
            if (inventory.InventoryTransactions != null && inventory.InventoryTransactions.Any())
            {
                dto.Transactions = inventory.InventoryTransactions
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new InventoryTransactionDto
                    {
                        TransactionId = t.TransactionId,
                        InventoryId = t.InventoryId,
                        PartName = inventory.Name,
                        Type = t.Type,
                        Quantity = t.Quantity,
                        QuantityBefore = t.QuantityBefore,
                        QuantityAfter = t.QuantityAfter,
                        Reason = t.Reason,
                        RepairCode = t.Repair?.RepairCode,
                        UserName = t.User?.FullName,
                        CreatedAt = t.CreatedAt
                    })
                    .ToList();
            }

            return Response<InventoryDto>.SuccessResult("Lấy thông tin linh kiện thành công", dto);
        }





        public async Task<Response<InventoryDto>> CreateInventoryAsync(InventoryCreateUpdateDto dto, int? userId = null)
        {
            var inventory = new Inventory
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Category = dto.Category?.Trim(),
                Brand = dto.Brand?.Trim(),
                Quantity = dto.Quantity,
                MinStock = dto.MinStock,
                CostPrice = dto.CostPrice,
                SellingPrice = dto.SellingPrice,
                IsActive = dto.IsActive,
                CreatedAt = _dateTimeProvider.Now
            };
            await _unitOfWork.Inventories.AddInventoryAsync(inventory);
            await _unitOfWork.CompleteAsync();

            // Tự động ghi nhận biến động kho nếu có số lượng tồn ban đầu
            if (inventory.Quantity > 0 && userId.HasValue)
            {
                var transaction = new InventoryTransaction
                {
                    InventoryId = inventory.InventoryId,
                    UserId = userId.Value,
                    Type = "Import",
                    Quantity = inventory.Quantity,
                    QuantityBefore = 0,
                    QuantityAfter = inventory.Quantity,
                    Reason = "Khởi tạo tồn kho đầu kỳ",
                    CreatedAt = _dateTimeProvider.Now
                };
                await _unitOfWork.Inventories.AddTransactionAsync(transaction);
                await _unitOfWork.CompleteAsync();
            }

            return Response<InventoryDto>.SuccessResult("Thêm linh kiện thành công", MapToDto(inventory, true));
        }

        // Cập nhật thông tin linh kiện hoặc điều chỉnh tồn kho
        public async Task<Response<InventoryDto>> UpdateInventoryAsync(int id, InventoryCreateUpdateDto dto, int? userId = null)
        {
            var inventory = await _unitOfWork.Inventories.GetInventoryByIdAsync(id);
            if (inventory == null)
            {
                return Response<InventoryDto>.Failure("Không tìm thấy linh kiện để cập nhật");
            }

            int oldQuantity = inventory.Quantity;

            inventory.Name = dto.Name.Trim();
            inventory.Description = dto.Description?.Trim();
            inventory.Category = dto.Category?.Trim();
            inventory.Brand = dto.Brand?.Trim();
            inventory.Quantity = dto.Quantity;
            inventory.MinStock = dto.MinStock;
            inventory.CostPrice = dto.CostPrice;
            inventory.SellingPrice = dto.SellingPrice;
            inventory.IsActive = dto.IsActive;

            _unitOfWork.Inventories.UpdateInventory(inventory);

            //ghi nhận biến động xuất nhập tồn khi số lượng thay đổi
            if (dto.Quantity != oldQuantity && userId.HasValue)
            {
                int diff = dto.Quantity - oldQuantity;
                var transaction = new InventoryTransaction
                {
                    InventoryId = inventory.InventoryId,
                    UserId = userId.Value,
                    Type = diff < 0 ? "Export" : "Adjust",
                    Quantity = Math.Abs(diff),
                    QuantityBefore = oldQuantity,
                    QuantityAfter = dto.Quantity,
                    Reason = diff < 0 ? "Xuất nhanh tại quầy hoặc giảm tồn kho" : "Điều chỉnh tăng tồn kho",
                    CreatedAt = _dateTimeProvider.Now
                };

                await _unitOfWork.Inventories.AddTransactionAsync(transaction);
            }
            await _unitOfWork.CompleteAsync();

            return Response<InventoryDto>.SuccessResult("Cập nhật linh kiện thành công", MapToDto(inventory, true));
        }
        // Nhập thêm hàng vào kho từ nhà cung cấp
        public async Task<Response<string>> ImportStockAsync(int id, ImportInventoryDto dto, int? userId = null)
        {
            if (dto.Quantity <= 0)
            {
                return Response<string>.Failure("Số lượng nhập phải lớn hơn 0");
            }

            var inventory = await _unitOfWork.Inventories.GetInventoryByIdAsync(id);
            if (inventory == null)
            {
                return Response<string>.Failure("Không tìm thấy linh kiện");
            }

            int oldQty = inventory.Quantity;
            int newQty = oldQty + dto.Quantity;

            inventory.Quantity = newQty;
            if (dto.CostPrice.HasValue && dto.CostPrice.Value > 0)
            {
                inventory.CostPrice = dto.CostPrice.Value;
            }

            _unitOfWork.Inventories.UpdateInventory(inventory);

            if (userId.HasValue)
            {
                var transaction = new InventoryTransaction
                {
                    InventoryId = id,
                    UserId = userId.Value,
                    Type = "Import",
                    Quantity = dto.Quantity,
                    QuantityBefore = oldQty,
                    QuantityAfter = newQty,
                    Reason = dto.Reason?.Trim() ?? "Nhập thêm hàng từ nhà cung cấp",
                    CreatedAt = _dateTimeProvider.Now
                };

                await _unitOfWork.Inventories.AddTransactionAsync(transaction);
            }

            await _unitOfWork.CompleteAsync();

            return Response<string>.SuccessResult("Nhập hàng vào kho thành công", $"Số lượng tồn mới: {newQty}");
        }

        // Lấy lịch sử các lần xuất nhập tồn của linh kiện
        public async Task<Response<IEnumerable<InventoryTransactionDto>>> GetTransactionsAsync(int id)
        {
            var transactions = await _unitOfWork.Inventories.GetTransactionsByInventoryIdAsync(id);
            var dtos = transactions.Select(t => new InventoryTransactionDto
            {
                TransactionId = t.TransactionId,
                InventoryId = t.InventoryId,
                PartName = t.Inventory?.Name,
                Type = t.Type,
                Quantity = t.Quantity,
                QuantityBefore = t.QuantityBefore,
                QuantityAfter = t.QuantityAfter,
                Reason = t.Reason,
                RepairCode = t.Repair?.RepairCode,
                UserName = t.User?.FullName,
                CreatedAt = t.CreatedAt
            });

            return Response<IEnumerable<InventoryTransactionDto>>.SuccessResult("Lấy lịch sử biến động kho thành công", dtos);
        }

        // Ngừng kinh doanh linh kiện
        public async Task<Response<string>> DeleteInventoryAsync(int id)
        {
            var inventory = await _unitOfWork.Inventories.GetInventoryByIdAsync(id);
            if (inventory == null)
            {
                return Response<string>.Failure("Không tìm thấy linh kiện để xóa");
            }

            inventory.IsActive = false;
            _unitOfWork.Inventories.UpdateInventory(inventory);
            await _unitOfWork.CompleteAsync();

            return Response<string>.SuccessResult("Đã chuyển linh kiện sang trạng thái ngừng kinh doanh", string.Empty);
        }

        // Chuyển đổi thực thể sang đối tượng truyền dữ liệu
        private static InventoryDto MapToDto(Inventory inventory, bool isAdmin)
        {
            return new InventoryDto
            {
                InventoryId = inventory.InventoryId,
                Name = inventory.Name,
                Description = inventory.Description,
                Category = inventory.Category,
                Brand = inventory.Brand,
                Quantity = inventory.Quantity,
                MinStock = inventory.MinStock,
                CostPrice = isAdmin ? inventory.CostPrice : 0,
                SellingPrice = inventory.SellingPrice,
                IsActive = inventory.IsActive,
                CreatedAt = inventory.CreatedAt
            };
        }
    }
}
