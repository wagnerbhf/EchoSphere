namespace EchoSphere.Models;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RoomId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string SenderUsername { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool IsPrivate { get; set; } = false;
    public string? ReceiverId { get; set; }
}