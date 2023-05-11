const axios = require("axios");

exports.handler = async function (context, event, callback) {
	try {
		let openFile = Runtime.getAssets()["/Segment-api-key.txt"].open;
		let segmentKey = openFile();
		console.log("SEGMENT KEY: " + segmentKey);
		console.log("EMAIL: " + event.email);

		let queryURL;
		if (event.email) {
			let email = event.email.toLowerCase();
			console.log(email);

			queryURL = `https://profiles.segment.com/v1/spaces/${process.env.SEGMENT_SPACE_ID}/collections/users/profiles/email:${email}/events?limit=3`;
		} else {
			throw new Error("No email supplied for Segment Profile lookup");
		}

		console.log(queryURL);
		let attributes;

		const eventsResponse = await axios.get(queryURL, {
			auth: {
				username: segmentKey,
				password: "",
			},
		});

		const eventsData = eventsResponse.data.data;
		const allowedTypes = ["Product Viewed", "Checkout Started", "Product Added", "Order Placed"];
		let latestEvents;
		if (eventsData != null) {
		latestEvents = eventsData
			.filter((event) => allowedTypes.includes(event.event))
			.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
			.map((event) => ({
			timestamp: event.timestamp,
			properties: event.properties,
			event: event.event,
			source_id: event.source_id,
			message_id: event.message_id,
			}));
		} else {
		latestEvents = "";
		}

		const responseObj = {
			events: latestEvents,
		};

		const response = new Twilio.Response();
		response.setBody(latestEvents);
		callback(null, responseObj);
	} catch (error) {
		console.error(error);
		const response = new Twilio.Response();
		response.setStatusCode(500);
		response.setBody("Something went wrong");
		callback(null, response);
	}
};
