import { Message } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/date";

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg",
            message.role === "user"
              ? "bg-muted ml-12"
              : "bg-primary/10 mr-12"
          )}
        >
          <Avatar
            className={cn(
              "h-8 w-8",
              message.role === "user" ? "bg-primary" : "bg-secondary"
            )}
          >
            {message.role === "assistant" ? (
              <img src="/fish.png" alt="Peixonauta" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs">
                {message.role === "user" ? "U" : message.role === "system" ? "S" : "F"}
              </span>
            )}
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {message.role === "user"
                  ? "You"
                  : message.role === "system"
                  ? "System"
                  : "Peixonauta"}
              </p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.timestamp))}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;