using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;
using Xunit.Abstractions;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.DTOs.Dashboard;
using DeviceCare.Application.Services;

namespace DeviceCare.UnitTests.Benchmarks
{
    public class DashboardBenchmarkTests : IDisposable
    {
        private readonly ITestOutputHelper _output;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IDashboardRepository> _mockDashboardRepo;
        private readonly IMemoryCache _memoryCache;

        public DashboardBenchmarkTests(ITestOutputHelper output)
        {
            _output = output;
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockDashboardRepo = new Mock<IDashboardRepository>();
            _mockUnitOfWork.Setup(u => u.Dashboards).Returns(_mockDashboardRepo.Object);
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
        }

        public void Dispose()
        {
            _memoryCache.Dispose();
        }

        [Fact]
        public async Task MeasureResponseTime_CacheEnabledVsDisabled()
        {
            const int totalRequests = 100;
            const int simulatedDbDelayMs = 45;

            var sampleDto = new DashboardSummaryDto
            {
                TotalPending = 12,
                TotalCompleted = 48,
                TotalRevenue = 64500000m,
                NewCustomers = 28,
                ChartData = new List<ChartDataDto>
                {
                    new ChartDataDto { Name = "T2", DoanhThu = 8000000m, Phieu = 5 },
                    new ChartDataDto { Name = "T3", DoanhThu = 12000000m, Phieu = 8 },
                    new ChartDataDto { Name = "T4", DoanhThu = 15000000m, Phieu = 11 },
                    new ChartDataDto { Name = "T5", DoanhThu = 9500000m, Phieu = 6 },
                    new ChartDataDto { Name = "T6", DoanhThu = 11000000m, Phieu = 9 },
                    new ChartDataDto { Name = "T7", DoanhThu = 7000000m, Phieu = 7 },
                    new ChartDataDto { Name = "CN", DoanhThu = 2000000m, Phieu = 2 }
                },
                RecentRepairs = new List<RecentRepairDto>
                {
                    new RecentRepairDto { Id = 1, Code = "SR-001", Device = "iPhone 13 Pro Max", Status = "Completed", Time = "08:30", Customer = "Nguyễn Văn A", TotalAmount = 1800000m },
                    new RecentRepairDto { Id = 2, Code = "SR-002", Device = "Samsung Galaxy S22", Status = "Repairing", Time = "09:15", Customer = "Trần Thị B", TotalAmount = 950000m }
                },
                StatusDistribution = new List<StatusDistributionDto>
                {
                    new StatusDistributionDto { Status = "Received", Label = "Tiếp nhận", Count = 5 },
                    new StatusDistributionDto { Status = "Repairing", Label = "Đang sửa", Count = 7 },
                    new StatusDistributionDto { Status = "Completed", Label = "Hoàn thành", Count = 48 }
                }
            };

            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync(It.IsAny<string>()))
                .Returns(async () =>
                {
                    await Task.Delay(simulatedDbDelayMs);
                    return sampleDto;
                });

            var serviceWithCache = new DashboardService(_mockUnitOfWork.Object, _memoryCache);

            var uncachedLatencies = new List<double>();
            for (int i = 0; i < 20; i++)
            {
                var sw = Stopwatch.StartNew();
                await _mockUnitOfWork.Object.Dashboards.GetDashboardSummaryAsync("week");
                sw.Stop();
                uncachedLatencies.Add(sw.Elapsed.TotalMilliseconds);
            }

            var cachedLatencies = new List<double>();
            await serviceWithCache.GetSummaryAsync("week");

            for (int i = 0; i < totalRequests; i++)
            {
                var sw = Stopwatch.StartNew();
                await serviceWithCache.GetSummaryAsync("week");
                sw.Stop();
                cachedLatencies.Add(sw.Elapsed.TotalMilliseconds);
            }

            double avgUncached = 0;
            foreach (var l in uncachedLatencies) avgUncached += l;
            avgUncached /= uncachedLatencies.Count;

            double avgCached = 0;
            double minCached = double.MaxValue;
            double maxCached = double.MinValue;
            foreach (var l in cachedLatencies)
            {
                avgCached += l;
                if (l < minCached) minCached = l;
                if (l > maxCached) maxCached = l;
            }
            avgCached /= cachedLatencies.Count;

            double speedupFactor = avgUncached / avgCached;
            double latencyReductionPercent = ((avgUncached - avgCached) / avgUncached) * 100.0;

            _output.WriteLine("===============================================================");
            _output.WriteLine("            DASHBOARD PERFORMANCE BENCHMARK RESULT             ");
            _output.WriteLine("===============================================================");
            _output.WriteLine($"Simulated DB Latency per Query: {simulatedDbDelayMs:F1} ms");
            _output.WriteLine($"[1] Cache TẮT (Cold DB Request) - Avg: {avgUncached:F2} ms (Min: {simulatedDbDelayMs:F1} ms)");
            _output.WriteLine($"[2] Cache BẬT (Hot RAM Request) - Avg: {avgCached:F4} ms (Min: {minCached:F4} ms, Max: {maxCached:F4} ms)");
            _output.WriteLine($"Tốc độ phản hồi nhanh hơn: {speedupFactor:F1}x lần");
            _output.WriteLine($"Thời gian phản hồi giảm: {latencyReductionPercent:F2}%");
            _output.WriteLine("===============================================================");

            avgCached.Should().BeLessThan(avgUncached);
            speedupFactor.Should().BeGreaterThan(50.0);
        }
    }
}
