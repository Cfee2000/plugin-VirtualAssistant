import {
	Card,
	Paragraph,
} from "@twilio-paste/core";
import { useEffect, useState } from "react";
import { withTaskContext } from "@twilio/flex-ui";

import * as Flex from "@twilio/flex-ui";

const ConversationSummaryCard = (props) => {
	const [summary, setSummary] = useState(null);

	useEffect(() => {
        if (props?.task?.attributes.conversationSid == null) {
            setSummary("NO CONVERSATION FOUND");
			return;
		}
        console.log("CONVERSATION SID SUMMARY CARD: " + props.task.attributes.conversationSid);
		console.log("IN CONVERSATION SUMMARY CARD COMPONENT useEFFECT");
		const getConversationSummaryFromAttributes = async () => {
			try {
				const conversationsClient = Flex.Manager.getInstance().conversationsClient;
				const conversation = await conversationsClient.getConversationBySid(
					props?.task?.attributes.conversationSid
				);
				const conversationAttributes = await conversation.getAttributes();
                console.log(conversationAttributes);
				if(conversationAttributes.summary){
					setSummary(conversationAttributes.summary);
				}else{
                    setSummary("NO SUMMARY AVAILABLE");
                }

			} catch (err) {
				console.error(`Error retrieving attributes.summary for Conversation SID: ${props.task.attributes.conversationSid}`, err);
				throw err;
			}
		}
		getConversationSummaryFromAttributes();
	}, [summary, props.task.attributes.conversationSid]);

	return (
		<div style={{ margin: 15 }}>
			<Card padding="space40">
				<Paragraph>
					{summary}
				</Paragraph>
			</Card>
		</div>
	);
};
export default withTaskContext(React.memo(ConversationSummaryCard));
