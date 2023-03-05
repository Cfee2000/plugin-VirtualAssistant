import React from "react";
import { FlexPlugin } from "@twilio/flex-plugin";
import { CustomizationProvider } from "@twilio-paste/core/customization";
import VoiceVirtualAssistant from "./components/voice/VoiceVirtualAssistant";
import DigitalChannelVirtualAssistant from "./components/digital/DigitalChannelVirtualAssistant";

const PLUGIN_NAME = "VirtualAssistantPlugin";

export default class VirtualAssistantPlugin extends FlexPlugin {
	constructor() {
		super(PLUGIN_NAME);
	}

	/**
	 * This code is run when your plugin is being started
	 * Use this to modify any UI components or attach to the actions framework
	 *
	 * @param flex { typeof import('@twilio/flex-ui') }
	 */
	async init(flex, manager) {
		// Add Paste as the default theme provider
		flex.setProviders({
			PasteThemeProvider: CustomizationProvider,
		});

		/**********************
		 *  PANEL2 Virtual Assistant
		 **********************/

		/**
		 * Determines if the Voice Virtual Assistant panel should be displayed based on the provided props.
		 *
		 * @param {Object} props The props object that contains the selected task and its attributes.
		 * @returns {boolean} Returns true if the task has a call sid attribute, false otherwise.
		 */
		const shouldDisplayPanel2_VoiceVirtualAssistant = (props) => {
			const t = props.tasks.get(props.selectedTaskSid);
			if (t && t.attributes?.call_sid) {
				return true;
			}
			return false;
		};

		/**
		 * Determines if the Digital Channel Virtual Assistant panel should be displayed based on the provided props.
		 *
		 * @param {Object} props The props object that contains the selected task and its attributes.
		 * @returns {boolean} Returns true if the task has a conversation sid attribute, false otherwise.
		 */
		const shouldDisplayPanel2_DigitalChannelVirtualAssistant = (props) => {
			const t = props.tasks.get(props.selectedTaskSid);
			if (t && t.attributes?.conversationSid) {
				return true;
			}
			return false;
		};

		//Conditionally replace Panel2 with the VoiceVirtualAssistant.
		flex.AgentDesktopView.Panel2.Content.replace(
			<VoiceVirtualAssistant key={Math.random()} />,
			{
				sortOrder: -1,
				if: shouldDisplayPanel2_VoiceVirtualAssistant,
			}
		);

		//Conditionally replace Panel2 with the DigitalChannelVirtualAssistant.
		flex.AgentDesktopView.Panel2.Content.replace(
			<DigitalChannelVirtualAssistant key={Math.random()} />,
			{
				sortOrder: -1,
				if: shouldDisplayPanel2_DigitalChannelVirtualAssistant,
			}
		);
	}
}
