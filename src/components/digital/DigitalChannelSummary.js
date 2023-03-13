import {
	Card,
	Heading,
	Paragraph,
	SkeletonLoader,
	Button,
	TextArea,
	Stack,
} from "@twilio-paste/core";
import { LoadingIcon } from "@twilio-paste/icons/esm/LoadingIcon";
import { useEffect, useState } from "react";

const DigitalChannelSummary = (props) => {
	const [summary, setSummary] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [editSummary, setEditSummary] = useState(false);

	const retrieveSummary = async () => {
		let retries = 0;
		try {
			setIsLoading(true);
			let response = await fetchSummary();
			let data = await response.json();

			while (
				!data.choices[0].text &&
				retries < process.env.REACT_APP_MAX_RETRIES
			) {
				console.log(
					"OPENAI API CALL IS NOT RETURNING DATA FOR THE DIGITAL CHANNEL SUMMARY RIGHT NOW. INITIATING RETRY LOGIC"
				);
				await new Promise((resolve) =>
					setTimeout(resolve, process.env.REACT_APP_RETRY_DELAY_MS)
				);
				response = await fetchSummary();
				data = await response.json();
				retries++;
				console.log("RETRIES: " + retries);
			}

			if (data.choices[0].text) {
				setSummary(data.choices[0].text);
			} else {
				throw new Error(
					"Failed to get digital channel summary from OpenAI after retries"
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
		const prompt = `In 5 sentences or less, provide a summarization of the following transcript between a virtual agent and a customer: ${props.promptTranscript}`;

		const response = await fetch(process.env.REACT_APP_OPENAI_GPT3_API_ENDPOINT, {
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
				`Failed to fetch voice call summary: ${response.status}`
			);
		}

		return response;
	};

	useEffect(() => {
		console.log("In Summary useEffect");
		try {
			retrieveSummary();
		} catch (error) {
			console.error(error);
		} 
	}, [props.promptTranscript]);

	const toggleSummarEditable = () => {
		setEditSummary((prevState) => !prevState);
	};

	const fetchNewSummary = async () => {
		try {
			await retrieveSummary();
		} catch (error) {
			console.error(error);
		} 
	};

	return (
		<>
			{isLoading ? (
				<>
					<Heading as="h3" variant="heading30">
						Loading....Please Wait
					</Heading>
					<SkeletonLoader height="150px" />
				</>
			) : (
				<>
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
								Summary of Virtual Agent Conversation
							</Heading>
							<Button
								variant="primary"
								size="small"
								onClick={() => fetchNewSummary()}
							>
								<LoadingIcon decorative={true} color="white"></LoadingIcon>{" "}
								Refresh
							</Button>
						</Stack>
						<Card>
							{editSummary ? (
								<>
									<TextArea
										key="editedResponse"
										id="editedResponse"
										value={summary}
										onChange={(e) => setSummary(e.target.value)}
									></TextArea>
									<div style={{ marginTop: "20px" }}></div>
								</>
							) : (
								<Paragraph>{summary}</Paragraph>
							)}
							<Button variant="secondary" onClick={toggleSummarEditable}>
								Toggle Edit Summary
							</Button>
						</Card>
					</Stack>
				</>
			)}
		</>
	);
};

export default React.memo(DigitalChannelSummary);
