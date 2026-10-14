namespace DeviceCare.Domain.Enums
{
    public enum RepairStatus
    {
        Received,     // Mới nhận
        Quoted,       // Báo giá
        Repairing,    // Đang sửa
        Completed,    // Đã xong
        Returned,     // Đã trả khách
        CannotRepair, // Không sửa được
        Cancelled     // Khách hủy
    }
}
