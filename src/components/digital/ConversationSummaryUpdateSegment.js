import ConversationSummaryCard from "./ConversationSummaryCard";
import { Button, AlertDialog, SkeletonLoader, Heading } from "@twilio-paste/core";
import { useEffect } from "react";

const ConversationSummaryUpdateSegment = (props) => {
	const [isLoadingSegment, setIsLoadingSegment] = useState(false);
    const [isSegmentAlertOpen, setIsSegmentAlertOpen] = useState(false);

    const handleSegmentAlertOpen = () => setIsSegmentAlertOpen(true);
	const handleSegmentAlertClose = () => setIsSegmentAlertOpen(false);

	const updateSegment = async (payload) => {
		try {
			const token = `${process.env.REACT_APP_SEGMENT_WRITE_TOKEN}:`;
			const authorization = `Basic ${Buffer.from(token).toString("base64")}`;

			const response = await fetch(
				process.env.REACT_APP_SEGMENT_WRITE_ENDPOINT,
				{
					method: "POST",
					headers: {
						Authorization: authorization,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				throw new Error("Segment update failed");
			}

			return response.json();
		} catch (error) {
			console.error(error);
			throw error;
		}
	};


    const pushSummaryToSegment = async (summary) => {
		const payloadSegment = {
			anonymousId: "flexSummary_" + props.customerEmail,
			event: "Transcript Summarization from Flex",
			properties: {
				email: props.customerEmail,
				summary: summary.replace(/^\n+/, ''),
			},
			type: "track",
		};

		try {
			setIsLoadingSegment(true);
			const response = await updateSegment(payloadSegment);
			console.log(response);
			console.log("Segment update successful");
		} catch (error) {
			console.error(error);
			console.log("Segment update failed");
		} finally {
			setIsLoadingSegment(false);
			handleSegmentAlertClose();
		}
	};


    // useEffect(() => {

    // }, []);

	return (
		<>
			<Button variant="primary" onClick={handleSegmentAlertOpen}>
				Update Segment
			</Button>
			{isLoadingSegment ? (
				<>
					<Heading as="h3" variant="heading30">
						Loading....Please Wait
					</Heading>
					<SkeletonLoader height="150px" />
				</>
			) : (
				<>
					<AlertDialog
						heading="Update Segment with Summary"
						isOpen={isSegmentAlertOpen}
						onConfirm={() => pushSummaryToSegment(summary)}
						onConfirmLabel="Update"
						onDismiss={handleSegmentAlertClose}
						onDismissLabel="Cancel"
					>
						You are about to update the Segment Profile of {props.customerName}{" "}
						with the following summary:
						<br />
						<br />
						{summary}
						<br />
						<br />
						Click "Update" to proceed, or "Cancel" to return to Flex.
					</AlertDialog>
				</>
			)}
		</>
	);
};
export default withTaskContext(React.memo(ConversationSummaryUpdateSegment));
