import {
	Card,
	SkeletonLoader,
	Tab,
	Tabs,
	TabPanel,
	TabPanels,
	TabList,
	Heading,
} from "@twilio-paste/core";
import VoiceCallTranscript from "./VoiceCallTranscript";
import VoiceCallSummary from "./VoiceCallSummary";
import VoiceCallNextBestAction from "./VoiceCallNextBestAction";

import { useEffect, useState } from "react";
import { withTaskContext } from "@twilio/flex-ui";

/**
 * This Functional Component is our main component for rendering the Virtual Assistant for Voice Calls in Flex. It manages the Transcript state that is passed down as props to the Transcript, Summary, and Next Best Action components
 * @param {*} props Uses "withTaskContext" to provide delegated props from the current Flex Task
 * @returns 
 */
const VoiceVirtualAssistant = (props) => {
	const [isLoading, setIsLoading] = useState(false); //Keep track of loading state on useEffect API calls. We're using Twilio Paste <SkeletonLoader> in the render
	const [transcript, setTranscript] = useState(null); //Full Transcript that has necessary metadata for providing a rich, Twilio Paste-centric UX experience for the agent to view
	const [promptTranscript, setPromptTranscript] = useState(null); //Modified Transcript that will be used by the VoiceCallSummary component when prompting OpenAI GPT-3 for a Summary

	const BASE_URL = process.env.REACT_APP_TRANSCRIPT_SERVICE_API_BASE || "";
	const API_TRANSCRIPT = "/transcript/retrieve?CallSid=";

	useEffect(() => {
		setIsLoading(true);
		if (props?.task?.attributes.call_sid == null) {
			setIsLoading(false);
			return; //If we don't have a Call SID, we won't render this component
		}

		const fetchData = async () => {
			try {
				//Use the current Call SID to retrieve the Dialogflow CX (CCAI) Virtual Agent Transcript that was stored in Twilio Sync. Note that the Sync endpoint is configured in the StatusCallbackURL of the Voice Studio Flow 
				const response = await fetch(
					BASE_URL + API_TRANSCRIPT + props?.task?.attributes.call_sid,
					{}
				); 
				//With the Fetch API we need to parse the response to a JSON object
				const body = await response.json();
				let pTranscript = "";

				//Loop through the Transcript and get it in an acceptable format for prompting the OpenAI GPT-3 API, specifically to retrieve the Summarization of the Virtual Agent Transcript only
				for (let i = 0; i < body.length; i++) {
					const { ResolvedInput, ReplyText } = body[i].data;
					pTranscript += `${ResolvedInput}\n${ReplyText}\n`;
				}
				setPromptTranscript(pTranscript);
				setTranscript(body);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [props?.task?.attributes.call_sid]);

	return (
		<Card>
			<Tabs
				selectedId="voiceVirtualAssistant"
				baseId="fitted-tabs-example"
				variant="fitted"
			>
				<TabList aria-label="Fitted product tabs">
					<Tab id="voiceVirtualAssistant">Virtual Assistant</Tab>
				</TabList>
				<Tabs orientation="vertical" baseId="vertical-tabs-example">
					<TabList aria-label="Virtual Assistant Tabs">
						<Tab>
							Transcript{" "}
							<svg
								style={{ verticalAlign: "middle", marginLeft: "12px" }}
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
						</Tab>
						<Tab>
							Summary{" "}
							<svg
								style={{ verticalAlign: "middle", marginLeft: "21px" }}
								xmlns="http://www.w3.org/2000/svg"
								width={28}
								height={28}
								viewBox="0 0 24 24"
							>
								<title>{"OpenAI icon"}</title>
								<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
							</svg>
						</Tab>
						<Tab>
							Next Action{" "}
							<svg
								style={{ verticalAlign: "middle", marginLeft: "8px" }}
								xmlns="http://www.w3.org/2000/svg"
								width={28}
								height={28}
								viewBox="0 0 24 24"
							>
								<title>{"OpenAI icon"}</title>
								<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
							</svg>
						</Tab>
					</TabList>
					{isLoading ? (
						<>
							<Heading as="h3" variant="heading30">
								Loading....Please Wait
							</Heading>
							<SkeletonLoader height="150px" />
						</>
					) : (
						<TabPanels>
							<TabPanel>
								{transcript && <VoiceCallTranscript transcript={transcript} />}
							</TabPanel>
							<TabPanel>
								{promptTranscript && (
									<VoiceCallSummary promptTranscript={promptTranscript} />
								)}
							</TabPanel>
							<TabPanel>
								{promptTranscript && (
									<VoiceCallNextBestAction
										promptTranscript={promptTranscript}
									/>
								)}
							</TabPanel>
						</TabPanels>
					)}
				</Tabs>
			</Tabs>
		</Card>
	);
};
export default withTaskContext(VoiceVirtualAssistant);
