exports.handler = async function (context, event, callback) {
	console.log(event.identity);
	console.log(event.conversationSid);

	const client = context.getTwilioClient();

	const attributes = {
		userId: "12345",
		traits: {
			firstName: "John",
			lastName: "Doe",
			fullName: "John Doe",
			email: "john.doe@example.com",
			phone: "+1-555-555-5555",
			yearsLoyalty: "3",
			lifetimePurchaseValue: "$500",
			engagementFrequency: "weekly",
			referralCount: "5",
			daysSinceLastPurchase: "30",
			gender: "male",
			age: "35",
			address: {
				street: "123 Main St",
				city: "Anytown",
				state: "CA",
				zip: "12345",
				country: "US",
			},
			preferences: {
				brands: ["Owl Shoe", "Acme Shoe"],
				categories: ["running", "athletic"],
				sizes: ["10", "10.5"],
				colors: ["blue", "black"],
			},
		},
	};

	try {
		const participants = await client.conversations.v1
			.conversations(event.conversationSid)
			.participants.list({ limit: 20 });

		let participant;
		if (event.identity.startsWith("+")) {
			// This is SMS or WhatsApp
			participant = participants.find(
				(p) => p.messagingBinding.address === event.identity
			);
		} else {
			// This is WebChat
			participant = participants.find((p) => p.identity === event.identity);
		}

		if (participant) {
			console.log("Participant found:");
			console.log(participant);

			const updateResult = await client.conversations.v1
				.conversations(event.conversationSid)
				.participants(participant.sid)
				.update({ attributes: JSON.stringify(attributes) });
			console.log("Participant Updated");
			console.log(updateResult);

			const response = new Twilio.Response();
			response.setBody(JSON.stringify(attributes));
			callback(null, attributes);
		} else {
			console.log("Participant not found");
			throw new Error("Participant not found");
		}
	} catch (error) {
		console.error(error);
		const response = new Twilio.Response();
		response.setStatusCode(500);
		response.setBody("Something went wrong");
		callback(null, response);
	}
};
