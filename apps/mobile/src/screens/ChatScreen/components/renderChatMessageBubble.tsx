import React from 'react';
import { View } from 'react-native';
import { ApprovalCard } from '../../../components/chat/ApprovalCard';
import { ToolCard } from '../../../components/chat/ToolCard';
import { AGENT_AVATAR_SLOT_WIDTH } from '../../../components/chat/messageLayout';
import { MessageBubble, MessageSelectionFrames } from '../../../components/MessageBubble';
import { ToolPresentation, UiMessage } from '../../../types/chat';
import { Space } from '../../../theme/tokens';

type Options = {
  forceSelected?: boolean;
  overlayMode?: boolean;
};

type Params = {
  agentDisplayName: string | null;
  chatFontSize: number;
  effectiveAvatarUri?: string;
  item: UiMessage;
  isFavorited: boolean;
  onAvatarPress: () => void;
  onImagePreview: (uris: string[], index: number) => void;
  onResolveApproval: (id: string, decision: 'allow-once' | 'allow-always' | 'deny') => void;
  onSelectMessage: (messageId: string, frames: MessageSelectionFrames) => void;
  onToggleSelection: (messageId: string) => void;
  options?: Options;
  selectedMessageId: string | null;
  showAgentAvatar: boolean;
  showModelUsage: boolean;
};

function renderToolPresentation(
  item: UiMessage,
  presentation: ToolPresentation,
  chatFontSize: number,
  onImagePreview: (uris: string[], index: number) => void,
  reserveAvatarSlot: boolean,
  overlayMode: boolean,
): React.ReactElement | null {
  if (presentation.kind === 'image-gallery') {
    return (
      <View style={reserveAvatarSlot ? { paddingLeft: AGENT_AVATAR_SLOT_WIDTH } : undefined}>
        <MessageBubble
          messageId={`${item.id}:presentation:image-gallery`}
          role="assistant"
          text=""
          timestampMs={item.timestampMs}
          imageUris={presentation.imageUris}
          onImagePress={overlayMode ? undefined : onImagePreview}
          overlayMode={overlayMode}
          reserveAvatarSlot={false}
          chatFontSize={chatFontSize}
        />
      </View>
    );
  }

  return null;
}

export function renderChatMessageBubble({
  agentDisplayName,
  chatFontSize,
  effectiveAvatarUri,
  item,
  isFavorited,
  onAvatarPress,
  onImagePreview,
  onResolveApproval,
  onSelectMessage,
  onToggleSelection,
  options,
  selectedMessageId,
  showAgentAvatar,
  showModelUsage,
}: Params): React.ReactElement {
  const reserveAvatarSlot = showAgentAvatar;

  if (item.approval) {
    return (
      <ApprovalCard
        approvalId={item.approval.id}
        command={item.approval.command}
        cwd={item.approval.cwd}
        host={item.approval.host}
        expiresAtMs={item.approval.expiresAtMs}
        status={item.approval.status}
        onResolve={onResolveApproval}
        reserveAvatarSlot={reserveAvatarSlot}
      />
    );
  }

  if (item.role === 'tool') {
    const toolPresentation = item.toolPresentation ?? [];
    return (
      <View style={{ gap: Space.xs }}>
        <ToolCard
          name={item.toolName ?? 'tool'}
          status={item.toolStatus ?? 'success'}
          summary={item.toolSummary ?? item.toolName ?? 'tool'}
          args={item.toolArgs}
          detail={item.toolDetail}
          durationMs={item.toolDurationMs}
          startedAtMs={item.toolStartedAt}
          finishedAtMs={item.toolFinishedAt}
          usage={item.usage}
          reserveAvatarSlot={reserveAvatarSlot}
        />
        {toolPresentation.map((presentation, index) => (
          <React.Fragment key={`${item.id}:tool-presentation:${index}`}>
            {renderToolPresentation(
              item,
              presentation,
              chatFontSize,
              onImagePreview,
              reserveAvatarSlot,
              !!options?.overlayMode,
            )}
          </React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <MessageBubble
      messageId={item.id}
      role={item.role}
      text={item.text}
      userSkill={item.role === 'user' ? item.userSkill : undefined}
      timestampMs={item.timestampMs}
      streaming={item.streaming}
      imageUris={item.imageUris}
      imageMetas={item.imageMetas}
      onImagePress={options?.overlayMode ? undefined : onImagePreview}
      avatarUri={item.role === 'assistant' && reserveAvatarSlot ? effectiveAvatarUri : undefined}
      onAvatarPress={item.role === 'assistant' ? onAvatarPress : undefined}
      displayName={item.role === 'assistant' ? (agentDisplayName ?? undefined) : undefined}
      isFavorited={item.role === 'assistant' && isFavorited}
      modelLabel={item.role === 'assistant' ? item.modelLabel : undefined}
      usage={item.role === 'assistant' ? item.usage : undefined}
      showModelUsage={showModelUsage}
      isSelected={options?.forceSelected ?? selectedMessageId === item.id}
      showSelectionHighlight={false}
      hideWhenSelected={!options?.overlayMode}
      onToggleSelection={options?.overlayMode ? undefined : onToggleSelection}
      onSelectMessage={options?.overlayMode ? undefined : onSelectMessage}
      overlayMode={options?.overlayMode}
      reserveAvatarSlot={item.role === 'assistant' ? reserveAvatarSlot : true}
      chatFontSize={chatFontSize}
    />
  );
}
