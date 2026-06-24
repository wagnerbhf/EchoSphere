using EchoSphere.DTOs;
using EchoSphere.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace EchoSphere.Hubs;

[Authorize]
public class EchoSphereHub : Hub
{
    private static readonly Dictionary<string, string> _connections = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = Context.User?.Identity?.Name;

        if (!string.IsNullOrEmpty(userId))
        {
            _connections[Context.ConnectionId] = userId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await Clients.All.SendAsync("UserConnected", username);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
            _connections.Remove(Context.ConnectionId);

        await Clients.All.SendAsync("UserDisconnected", userId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("UserJoined", Context.User?.Identity?.Name, roomId);
    }

    public async Task SendMessage(SendMessageDto dto)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var username = Context.User?.Identity?.Name!;

        var message = new Message
        {
            RoomId = dto.RoomId,
            SenderId = userId,
            SenderUsername = username,
            Content = dto.Content,
            Timestamp = DateTime.UtcNow
        };

        await Clients.Group(dto.RoomId).SendAsync("ReceiveMessage", message);
    }

    public async Task SendPrivateMessage(SendPrivateMessageDto dto)
    {
        var fromUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var username = Context.User?.Identity?.Name!;

        var message = new Message
        {
            SenderId = fromUserId,
            SenderUsername = username,
            Content = dto.Content,
            Timestamp = DateTime.UtcNow,
            IsPrivate = true,
            ReceiverId = dto.ToUserId
        };

        await Clients.Group($"user_{dto.ToUserId}").SendAsync("ReceivePrivateMessage", message);
        await Clients.Caller.SendAsync("ReceivePrivateMessage", message);
    }
}