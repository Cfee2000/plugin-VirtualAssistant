import { Avatar, Card, Box, Tooltip, Badge } from "@twilio-paste/core";
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

const DigitalChannelTranscript = (props) => {
	const getVariantForSentiment = (score) => {
		if (score <= -0.2) return "error";
		else if (score <= -0.5) return "warning";
		else if (score >= 0.5) return "success";
		else return "neutral";
	};

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
								<svg
									width={40}
									height={40}
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<g fill="none">
										<path
											d="m12.65 2.154 6.253 3.66c.424.232.69.674.695 1.156v8.033a1.341 1.341 0 0 1-.695 1.155L8.94 21.984a.341.341 0 0 1-.514-.284v-3.535l-3.419-2.007a1.341 1.341 0 0 1-.695-1.155V6.97c.006-.482.271-.924.695-1.156l6.254-3.66c.43-.247.96-.247 1.39 0z"
											fill="#aecbfa"
										/>
										<path
											d="M8.192 9.48a.382.382 0 0 0-.382.37v3.945l.001.04a.73.73 0 0 0 .353.584l.014.008 1.924 1.098v1.54l.001.03a.382.382 0 0 0 .559.309l.014-.008 5.103-2.955.036-.021a.73.73 0 0 0 .332-.594V9.862a.382.382 0 0 0-.56-.337l-.012.006-3.394 1.949-.029.016a.382.382 0 0 1-.362-.01l-.013-.006-3.395-1.95a.382.382 0 0 0-.19-.05z"
											fill="#669df6"
										/>
										<path
											d="M12.245 5.063a.478.478 0 0 0-.459-.009l-.013.008L8.03 7.175a.382.382 0 0 0-.013.657l.01.007 3.742 2.15c.144.082.32.084.465.006l.014-.008 3.684-2.15a.382.382 0 0 0 .008-.655l-.01-.006z"
											fill="#185abc"
										/>
									</g>
								</svg>
								Dialogflow CX - Start of Digital Channel Transcript{' '}
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
									{item.customerIntent && (
										<ChatMessage variant="inbound">
											<ChatBubble>{item.customerIntent}</ChatBubble>
											<ChatMessageMeta
												aria-label="Customer" //Later Update this with Segment Customer Profile Name
												
											>
												<Tooltip text={item.customerName}>
													<ChatMessageMetaItem>
														<Avatar
															name={item.customerName} //Later Update this with Segment Customer Profile Name
															size="sizeIcon20"
														/>
														{item.customerName}{' '}
														<Moment format="hh:mm:ss" date={item.dateCreated} />
													</ChatMessageMetaItem>
												</Tooltip>
												{item.sentimentAnalysisResult.score && (
													<Tooltip
														text={item.sentimentAnalysisResult.score || "Unknown"}
													>
														<ChatMessageMetaItem>
															<Badge
																as="span"
																variant={getVariantForSentiment(
																	parseFloat(item.sentimentAnalysisResult.score)
																)}
															>
																{getLabelForSentiment(
																	parseFloat(item.sentimentAnalysisResult.score)
																)}
															</Badge>
														</ChatMessageMetaItem>
													</Tooltip>
												)}
											</ChatMessageMeta>
										</ChatMessage>
									)}
									<ChatMessage variant="outbound">
										<ChatBubble>{item.virtualAgentReply}</ChatBubble>
										<ChatMessageMeta aria-label={item.author}>
											<Tooltip
												text={
													item.intentDisplayName ||
													"unknown"
												}
											>
												<ChatMessageMetaItem>
													<Avatar
														name={item.author}//TBD naming
														size="sizeIcon20"
													/>
													{item.author}{' '}
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
								Dialogflow CX - End of Digital Channel Transcript{' '}
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

export default React.memo(DigitalChannelTranscript);
