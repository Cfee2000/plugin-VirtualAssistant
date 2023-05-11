const axios = require("axios");

exports.handler = async function (context, event, callback) {
	console.log("Identity of customer/user: " + event.identity);
	console.log("Conversation SID: " + event.conversationSid);
	console.log("Participant Sid: " + event.participantSid);

	const client = context.getTwilioClient();

	try {
		let openFile = Runtime.getAssets()["/Segment-api-key.txt"].open;
		let segmentKey = openFile();
		console.log("SEGMENT KEY: " + segmentKey);

		let queryURL;
		if (event.email) {
			let email = event.email.toLowerCase();
			console.log(email);

			queryURL = `https://profiles.segment.com/v1/spaces/${process.env.SEGMENT_SPACE_ID}/collections/users/profiles/email:${email}/traits?limit=100`;
		} else if (event.twilioNumber) {
			let twilioNumberNoPlus = event.twilioNumber.substring(1);
			queryURL = `https://profiles.segment.com/v1/spaces/${process.env.SEGMENT_SPACE_ID}/collections/users/profiles/phone:${twilioNumberNoPlus}/traits?limit=100`;
		} else {
			throw new Error(
				"No email or twilioNumber supplied for Segment Profile lookup"
			);
		}

		console.log(queryURL);
		let attributes;
		try {
			const response = await axios.get(queryURL, {
				auth: { username: segmentKey },
			});
			attributes = await response.data;
			console.log(JSON.stringify(attributes.traits));
		} catch (error) {
			console.error(error);
		}

		const whitelist = [
			"address",
			"age",
			"average_order_value",
			"daysSinceLastPurchase",
			"email",
			"engagementFrequency",
			"firstName",
			"gender",
			"lastName",
			"last_campaign_response",
			"last_order",
			"last_product_order",
			"lifetimePurchaseValue",
			"loyaltyProgram",
			"name",
			"phone",
			"referralCount",
			"sms_chat_orders",
			"web_chat_orders",
			"yearsLoyalty",
		];

		const whitelistedTraits = {};
		for (const key of whitelist) {
			if (attributes.traits.hasOwnProperty(key)) {
				whitelistedTraits[key] = attributes.traits[key];
			}
		}

		const updateResult = await client.conversations.v1
			.conversations(event.conversationSid)
			.participants(event.participantSid)
			.update({ attributes: JSON.stringify({ traits: whitelistedTraits }) });
		console.log(
			`Participant ${event.participantSid} Updated with Segment Profile data`
		);
		console.log(updateResult);

		const response = new Twilio.Response();
		response.setBody(JSON.stringify({ traits: whitelistedTraits }));
		callback(null, { traits: whitelistedTraits });
	} catch (error) {
		console.error(error);
		const response = new Twilio.Response();
		response.setStatusCode(500);
		response.setBody("Something went wrong");
		callback(null, response);
	}
};
