const { SessionsClient } = require("@google-cloud/dialogflow-cx");

exports.handler = async function (context, event, callback) {
	try {
		const originalJSON = JSON.parse(event.customerData);

		const newJSON = {
			fields: {
				firstName: {
					kind: "stringValue",
					stringValue: originalJSON.traits.firstName,
				},
				lastName: {
					kind: "stringValue",
					stringValue: originalJSON.traits.lastName,
				},
				email: {
					kind: "stringValue",
					stringValue: originalJSON.traits.email,
				},
				phone: {
					kind: "stringValue",
					stringValue: originalJSON.traits.phone,
				},
				yearsLoyalty: {
					kind: "stringValue",
					stringValue: originalJSON.traits.yearsLoyalty,
				},
				lifetimePurchaseValue: {
					kind: "stringValue",
					stringValue: originalJSON.traits.lifetimePurchaseValue,
				},
				engagementFrequency: {
					kind: "stringValue",
					stringValue: originalJSON.traits.engagementFrequency,
				},
				referralCount: {
					kind: "stringValue",
					stringValue: originalJSON.traits.referralCount,
				},
				daysSinceLastPurchase: {
					kind: "stringValue",
					stringValue: originalJSON.traits.daysSinceLastPurchase,
				},
				gender: {
					kind: "stringValue",
					stringValue: originalJSON.traits.gender,
				},
				age: {
					kind: "stringValue",
					stringValue: originalJSON.traits.age,
				},
				address: {
					kind: "stringValue",
					stringValue: JSON.stringify(originalJSON.traits.address),
				},
				preferences: {
					kind: "stringValue",
					stringValue: JSON.stringify(originalJSON.traits.preferences),
				},
			},
		};

		if (event.customerEvents) {
			console.log("Customer Events EXIST");
			const customerEvents = JSON.parse(event.customerEvents);
			const eventsArray = customerEvents.events; // Access the events array directly
			console.log("EVENTS ARRAY");
			console.log(eventsArray);

			if (eventsArray.length > 0) {
				const customerEvent = eventsArray[0];
				console.log("Customer Event Name");
				console.log(customerEvent.event);
				console.log("Customer Event Properties");
				console.log(customerEvent.properties);
				const eventType = customerEvent.event.replace(/\s+/g, "").toLowerCase();
				const properties = customerEvent.properties;

				if (["checkoutstarted", "orderplaced"].includes(eventType)) {
					console.log("PRODUCTS 0 TEST");
					console.log(properties.products["0"]);

					const product = properties.products["0"];
					newJSON.fields["qualifying_product"] = {
						kind: "stringValue",
						stringValue: product.product_name,
					};
					newJSON.fields["qualifying_product_price"] = {
						kind: "stringValue",
						stringValue: product.product_price,
					};
				} else if (["productviewed", "productadded"].includes(eventType)) {
					newJSON.fields["qualifying_product"] = {
						kind: "stringValue",
						stringValue: properties.product_name,
					};
					newJSON.fields["qualifying_product_price"] = {
						kind: "stringValue",
						stringValue: properties.product_price,
					};
				}
			}
		}

		let dialogflowChannel = "";
		let keyValue = "";

		if (event.ChannelSource === "SMS" || event.ChannelSource === "Whatsapp") {
			dialogflowChannel = event.ChannelSource;
			keyValue = event.Phone.substring(event.Phone.lastIndexOf("+") + 1);
			newJSON.fields.mobile_number = {
				kind: "stringValue",
				stringValue: keyValue,
			};
		} else if (event.ChannelSource === "API" || event.ChannelSource === "SDK") {
			if (event.ChannelSource === "API") {
				dialogflowChannel = "WebChat";
			} else {
				dialogflowChannel = "Unknown";
			}
			keyValue = event.email;
			newJSON.fields.email = {
				kind: "stringValue",
				stringValue: keyValue,
			};
		} else if (event.ChannelSource === "GBM") {
			dialogflowChannel = event.ChannelSource;
			keyValue = event.gbm_agent.substring(
				event.gbm_agent.lastIndexOf(":") + 1
			);
			newJSON.fields.gbm_agent = {
				kind: "stringValue",
				stringValue: keyValue,
			};
		} else {
			console.error(
				`Channel Source: ${event.ChannelSource} does not match SMS or API. Check Studio logs for trigger.conversation.Source and add to Function code in agnostic_detect_intent_inbound.js`
			);
		}

		const languageCode = context.DIALOGFLOW_CX_LANGUAGE_CODE;
		const query = event.utterance;

		process.env.GOOGLE_APPLICATION_CREDENTIALS =
			Runtime.getAssets()["/service-account-key.json"].path;

		const client = new SessionsClient({
			apiEndpoint: `${context.DIALOGFLOW_CX_LOCATION}-dialogflow.googleapis.com`,
		});

		const request = {
			session: client.projectLocationAgentSessionPath(
				context.DIALOGFLOW_CX_PROJECT_ID,
				context.DIALOGFLOW_CX_LOCATION,
				context.DIALOGFLOW_CX_AGENT_ID,
				event.dialogflow_session_id || Math.random().toString(36).substring(7)
			),
			queryInput: {
				text: {
					text: query,
				},
				languageCode,
			},
			queryParams: {
				parameters: newJSON,
				analyzeQueryTextSentiment: true,
				channel: dialogflowChannel,
			},
		};

		const [response] = await client.detectIntent(request);
		response.queryResult.session_id = request.session.split("/").pop();
		const payload = {};

		if (response.queryResult.parameters) {
			payload.parameters = response.queryResult.parameters;
		}
		if (response.queryResult.currentPage) {
			payload.currentPage = response.queryResult.currentPage;
		}
		if (response.queryResult.match) {
			payload.match = response.queryResult.match;
		}
		if (response.queryResult.sentimentAnalysisResult) {
			payload.sentimentAnalysisResult =
				response.queryResult.sentimentAnalysisResult;
		}
		if (response.queryResult.triggerIntent) {
			payload.triggerIntent = response.queryResult.triggerIntent;
		}
		if (response.queryResult.triggerEvent) {
			payload.triggerEvent = response.queryResult.triggerEvent;
		}
		if (response.queryResult.dtmf) {
			payload.dtmf = response.queryResult.dtmf;
		}

		const responseMessages = [];

		for (const message of response.queryResult.responseMessages) {
			if (message.responseType) {
				payload.responseType = message.responseType;
			}
			if (message.channel) {
				payload.channel = message.channel;
			}
			if (message.payload) {
				//We need to transform this payload so that it can be used by the Webchat React Code (see https://github.com/dremin/retail-webchat-react-app/blob/main/src/components/MessageBubble.tsx)
				payload.transformedPayload = {
					options: message.payload.fields.options.listValue.values.map(
						(item) => ({
							text: item.structValue.fields.text.stringValue,
						})
					),
					type: message.payload.fields.type.stringValue,
				};
			}
			if (message.liveAgentHandoff) {
				payload.liveAgentHandoff = message.liveAgentHandoff;
			}
			if (message.conversationSuccess) {
				payload.conversationSuccess = message.conversationSuccess;
			}
			if (message.endInteraction) {
				payload.endInteraction = message.endInteraction;
			}
			if (message.text) {
				let messageText = message.text.text[0];
				if (!/\s$/.test(messageText)) {
					messageText += " ";
				}
				responseMessages.push(messageText);
			}
		}

		payload.virtualAgentReply = responseMessages;
		payload.customerIntent = response.queryResult.text;
		payload.sentimentAnalysisScore =
			response.queryResult.sentimentAnalysisResult.score;
		payload.sentimentAnalysisMagnitude =
			response.queryResult.sentimentAnalysisResult.magnitude;
		payload.confidence = response.queryResult.match.confidence;
		payload.sessionID = response.queryResult.session_id;

		console.log("Payload");
		console.log(payload);

		const twilioResponse = new Twilio.Response();
		twilioResponse.setBody(JSON.stringify(payload));
		callback(null, payload);
	} catch (error) {
		console.error(error);
		callback(error);
	}
};
