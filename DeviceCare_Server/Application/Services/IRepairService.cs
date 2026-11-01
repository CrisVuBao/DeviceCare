using System.Collections.Generic;
using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Repair;
using DeviceCare.Domain.Models;

namespace DeviceCare.Application.Services
{
    public interface IRepairService
    {
        Task<Response<int>> CreateRepairAsync(CreateRepairDto model, int? employeeId = null, int? userId = null);
        Task<Response<List<RepairListDto>>> GetAllRepairsAsync(string? status, string? search);
        Task<Response<PagedResult<RepairListDto>>> GetPagedRepairsAsync(int page, int pageSize, string? status, string? search);
        Task<Response<RepairDetailDto>> GetRepairDetailDtoAsync(int id);
        Task<Response<Repair>> GetRepairDetailAsync(int id);
        Task<Response<string>> UpdateRepairAsync(int id, UpdateRepairDto model);
        Task<Response<string>> UpdateStatusAsync(int id, UpdateStatusDto model, int? userId = null);
        Task<Response<string>> CheckoutAsync(int id, CheckoutRepairDto dto, int? userId = null);
        Task<Response<string>> DeleteRepairAsync(int id);
        Task<Response<List<PublicLookupDto>>> LookupByPhoneAsync(string phone);
        Task<Response<string>> AddRepairPartAsync(int id, AddRepairPartDto dto, int? userId = null);
        Task<Response<string>> RemoveRepairPartAsync(int id, int partId, int? userId = null);
    }
}
