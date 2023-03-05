import {
	Avatar,
	Card,
	Box,
	Tooltip,
	Badge,
} from "@twilio-paste/core";
import {
	ChatLog,
	ChatMessage,
	ChatMessageMeta,
	ChatMessageMetaItem,
	ChatBubble,
	ChatBookend,
	ChatBookendItem,
} from "@twilio-paste/core/chat-log";
import Moment from "react-moment";

/**
 * This Functional Component renders the Voice Transcript from a Dialogflow CX Virtual Agent. Credit and inspiration provided by Chris Connolly and his plugin - https://github.com/chaosloth/flex-dialogflow-voice-transcript
 * @param {*} props Contains the full voice transcript with associated metadata 
 * @returns 
 */
const VoiceCallTranscript = (props) => {

	//Based on the sentiment score from a given message in the transcript, we will assign a Variant that is recognized by Twilio Paste 
    const getVariantForSentiment = (score) => {
		if (score <= -0.2) return "error";
		else if (score <= -0.5) return "warning";
		else if (score >= 0.5) return "success";
		else return "neutral";
	};

	//Based on the sentiment score from a given message in the transcript, we will assign a Label that is recognized by Twilio Paste 
	const getLabelForSentiment = (score) => {
		if (score <= -0.2) return "negative";
		else if (score <= -0.5) return "poor";
		else if (score >= 0.5) return "positive";
		else return "neutral";
	};

	return (
		<Card>
			<Box
				overflow="scroll"
				inset={undefined}
				gridRow={undefined}
				gridColumn={undefined}
				gridAutoFlow={undefined}
				gridAutoColumns={undefined}
				gridAutoRows={undefined}
				gridTemplateColumns={undefined}
				gridTemplateRows={undefined}
				gridTemplateAreas={undefined}
				gridArea={undefined}
			>
				<ChatLog>
					{props.transcript && (
						<ChatBookend>
							<ChatBookendItem>
								Dialogflow CX - Start of Voice Transcript
								<Moment format="hh:mm:ss" date={props.transcript[0].dateCreated} />
							</ChatBookendItem>
						</ChatBookend>
					)}

					{props.transcript &&
						props.transcript.map((item, idx) => {
							return (
								<Box
									key={idx}
									inset={undefined}
									gridRow={undefined}
									gridColumn={undefined}
									gridAutoFlow={undefined}
									gridAutoColumns={undefined}
									gridAutoRows={undefined}
									gridTemplateColumns={undefined}
									gridTemplateRows={undefined}
									gridTemplateAreas={undefined}
									gridArea={undefined}
								>
									{item.data.ResolvedInput && (
										<ChatMessage variant="inbound">
											<ChatBubble>{item.data.ResolvedInput}</ChatBubble>
											<ChatMessageMeta
												aria-label="Customer" //Later Update this with Segment Customer Profile Name
											>
												<Tooltip text={item.data.EndUserId}>
													<ChatMessageMetaItem>
														<Avatar
															name="Customer" //Later Update this with Segment Customer Profile Name
															size="sizeIcon20"
														/>
														Customer
														<Moment format="hh:mm:ss" date={item.dateCreated} />
													</ChatMessageMetaItem>
												</Tooltip>
												{item.data.SentimentAnalysisScore && (
													<Tooltip
														text={item.data.SentimentAnalysisScore || "Unknown"}
													>
														<ChatMessageMetaItem>
															<Badge
																as="span"
																variant={getVariantForSentiment(
																	parseFloat(item.data.SentimentAnalysisScore)
																)}
															>
																{getLabelForSentiment(
																	parseFloat(item.data.SentimentAnalysisScore)
																)}
															</Badge>
														</ChatMessageMetaItem>
													</Tooltip>
												)}
											</ChatMessageMeta>
										</ChatMessage>
									)}
									<ChatMessage variant="outbound">
										<ChatBubble>{item.data.ReplyText}</ChatBubble>
										<ChatMessageMeta aria-label="Virtual Agent">
											<Tooltip
												text={
													item.data.IntentDisplayName ||
													item.data.IntentId ||
													"unknown"
												}
											>
												<ChatMessageMetaItem>
													<Avatar
														name="Virtual Agent" //TBD naming
														size="sizeIcon20"
													/>
													Virtual Agent
													<Moment format="hh:mm:ss" date={item.dateCreated} />
												</ChatMessageMetaItem>
											</Tooltip>
										</ChatMessageMeta>
									</ChatMessage>
								</Box>
							);
						})}
					{props.transcript && (
						<ChatBookend>
							<ChatBookendItem>
								Dialogflow CX - End of Voice Transcript
								<Moment
									format="hh:mm:ss"
									date={props.transcript[props.transcript.length - 1].dateCreated}
								/>
							</ChatBookendItem>
						</ChatBookend>
					)}
				</ChatLog>
			</Box>
		</Card>
	);
};

export default React.memo(VoiceCallTranscript);
