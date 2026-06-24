namespace EchoSphere.DTOs;

public class SendMessageDto
{
    public string RoomId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class SendPrivateMessageDto
{
    public string ToUserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}