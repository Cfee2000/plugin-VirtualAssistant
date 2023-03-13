import {
	Card,
	Heading,
	Stack,
	Paragraph,
	SkeletonLoader,
	Button,
} from "@twilio-paste/core";

import { LoadingIcon } from "@twilio-paste/icons/esm/LoadingIcon";
import { useEffect, useState } from "react";

const VoiceCallNextBestAction = (props) => {
	const [nextBestActions, setNextBestActions] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setIsLoading(true);
		const retrieveNextBestAction = async () => {
			let retries = 0;
			try {
				let response = await fetchSummary();
				let data = await response.json();
				let allEmpty = data.choices.every((choice) => choice.text === "");

				while (allEmpty && retries < process.env.REACT_APP_MAX_RETRIES) {
					console.log(
						"OPENAI API CALL IS NOT RETURNING VOICE CALL NEXT BEST ACTIONS RIGHT NOW. INITIATING RETRY LOGIC"
					);
					await new Promise((resolve) =>
						setTimeout(resolve, process.env.REACT_APP_RETRY_DELAY_MS)
					);
					response = await fetchSummary();
					data = await response.json();
					allEmpty = data.choices.every((choice) => choice.text === "");
					retries++;
					console.log("RETRIES: " + retries);
				}

				if (!allEmpty) {
					setNextBestActions(data.choices.map((choice) => choice.text));
				} else {
					throw new Error(
						"Failed to get voice call next best actions from OpenAI after retries"
					);
				}
			} catch (error) {
				/* show error message */
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		const fetchSummary = async () => {
			const prompt = `Full Transcript, delimited by the "%" symbol: \n%${props.promptTranscript}%\n\n You are John Doe, a Customer Service Representative, and are currently connected to Brent Jones live. As you can see from the transcript, Brent was previously connected to a Virtual Agent that wasn’t fully able to resolve his inquiry. You need to pick up where the transcript leaves off, and provide an intelligent, empathetic, and solution oriented approach to your next response to Brent. You should be extremely cognizant of the information Brent has already shared with either the Virtual Agent or yourself, and absolutely do not ask Brent for information that is already available in the transcript. With all that in mind, respond to Brent with the next best action, and do so in the first person without prefixing your response.`;

			const response = await fetch("https://api.openai.com/v1/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					prompt: prompt,
					max_tokens: 1000,
					temperature: 0.8,
					model: "text-davinci-003",
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch voice call next best actions: ${response.status}`
				);
			}

			return response;
		};

		retrieveNextBestAction();
	}, [props.promptTranscript]);

	return (
		<>
			{isLoading ? (
				<SkeletonLoader height="150px" />
			) : (
				<Stack orientation="vertical" spacing="space60">
					<Stack orientation="horizontal" spacing="space50">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={40}
							height={40}
							viewBox="0 0 24 24"
						>
							<title>{"OpenAI icon"}</title>
							<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
						</svg>
						<Heading as="h3" variant="heading30" marginBottom="space0">
							Next Best Action Options
						</Heading>
					</Stack>
					{nextBestActions &&
						nextBestActions.map((text, index) => (
							<Card key={index}>
								<Heading as="h5" variant="heading50">
									Option {index + 1}
								</Heading>
								<Paragraph>{text}</Paragraph>
							</Card>
						))}
				</Stack>
			)}
		</>
	);
};

export default React.memo(VoiceCallNextBestAction);
