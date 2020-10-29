import React, { useState, useEffect, useContext } from "react";
import "emoji-mart/css/emoji-mart.css";
import { useParams } from "react-router-dom";
import { Picker } from "emoji-mart";
import { toast } from "react-toastify";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import MicIcon from "@material-ui/icons/Mic";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const useStyles = makeStyles(theme => ({
	mainWrapper: {
		background: "#eee",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
	},

	newMessageBox: {
		background: "#eee",
		width: "100%",
		display: "flex",
		padding: "7px",
		alignItems: "center",
	},

	messageInputWrapper: {
		padding: 6,
		marginRight: 7,
		background: "#fff",
		display: "flex",
		borderRadius: 20,
		flex: 1,
	},

	messageInput: {
		paddingLeft: 10,
		flex: 1,
		border: "none",
	},

	sendMessageIcons: {
		color: "grey",
	},

	uploadInput: {
		display: "none",
	},

	viewMediaInputWrapper: {
		display: "flex",
		padding: "10px 13px",
		position: "relative",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#eee",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
	},

	emojiBox: {
		position: "absolute",
		bottom: 63,
		width: 40,
		borderTop: "1px solid #e8e8e8",
	},

	circleLoading: {
		color: green[500],
		opacity: "70%",
		position: "absolute",
		top: "20%",
		left: "50%",
		marginLeft: -12,
	},

	audioLoading: {
		color: green[500],
		opacity: "70%",
	},

	recorderWrapper: {
		display: "flex",
		alignItems: "center",
		alignContent: "middle",
	},

	cancelAudioIcon: {
		color: "red",
	},

	sendAudioIcon: {
		color: "green",
	},

	quotedMsgWrapper: {
		display: "flex",
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 8,
		paddingLeft: 73,
		paddingRight: 7,
	},

	quotedContainer: {
		flex: 1,
		marginRight: 5,
		overflowY: "hidden",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		borderRadius: "7.5px",
		display: "flex",
		position: "relative",
	},

	quotedMsgBody: {
		padding: 10,
		height: "auto",
		display: "block",
		whiteSpace: "pre-wrap",
		overflow: "hidden",
	},

	quotedSideOther: {
		flex: "none",
		width: "4px",
		backgroundColor: "#35cd96",
	},

	quotedSideMine: {
		flex: "none",
		width: "4px",
		backgroundColor: "#6bcbef",
	},

	messageContactName: {
		display: "flex",
		color: "#6bcbef",
		fontWeight: 500,
	},
}));

const MessageInput = ({ ticketStatus }) => {
	const classes = useStyles();
	const { ticketId } = useParams();
	const username = localStorage.getItem("username");

	const [medias, setMedias] = useState([]);
	const [inputMessage, setInputMessage] = useState("");
	const [showEmoji, setShowEmoji] = useState(false);
	const [loading, setLoading] = useState(false);
	const [recording, setRecording] = useState(false);
	const { setReplyingMessage, replyingMessage } = useContext(
		ReplyMessageContext
	);

	useEffect(() => {
		return () => {
			setInputMessage("");
			setShowEmoji(false);
			setMedias([]);
		};
	}, [ticketId]);

	const handleChangeInput = e => {
		setInputMessage(e.target.value);
	};

	const handleAddEmoji = e => {
		let emoji = e.native;
		setInputMessage(prevState => prevState + emoji);
	};

	const handleChangeMedias = e => {
		if (!e.target.files) {
			return;
		}

		const selectedMedias = Array.from(e.target.files);
		setMedias(selectedMedias);
	};

	const handleInputPaste = e => {
		if (e.clipboardData.files[0]) {
			setMedias([e.clipboardData.files[0]]);
		}
	};

	const handleUploadMedia = async e => {
		setLoading(true);
		e.preventDefault();

		const formData = new FormData();
		formData.append("fromMe", true);
		medias.forEach(media => {
			formData.append("medias", media);
			formData.append("body", media.name);
		});

		try {
			await api.post(`/messages/${ticketId}`, formData);
		} catch (err) {
			const errorMsg = err.response?.data?.error;
			if (errorMsg) {
				if (i18n.exists(`backendErrors.${errorMsg}`)) {
					toast.error(i18n.t(`backendErrors.${errorMsg}`));
				} else {
					toast.error(err.response.data.error);
				}
			} else {
				toast.error("Unknown error");
			}
		}

		setLoading(false);
		setMedias([]);
	};

	const handleSendMessage = async () => {
		if (inputMessage.trim() === "") return;
		setLoading(true);

		const message = {
			read: 1,
			fromMe: true,
			mediaUrl: "",
			body: `${username}: ${inputMessage.trim()}`,
		};
		try {
			await api.post(`/messages/${ticketId}`, message);
		} catch (err) {
			const errorMsg = err.response?.data?.error;
			if (errorMsg) {
				if (i18n.exists(`backendErrors.${errorMsg}`)) {
					toast.error(i18n.t(`backendErrors.${errorMsg}`));
				} else {
					toast.error(err.response.data.error);
				}
			} else {
				toast.error("Unknown error");
			}
		}

		setInputMessage("");
		setShowEmoji(false);
		setLoading(false);
	};

	const handleStartRecording = async () => {
		setLoading(true);
		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });
			await Mp3Recorder.start();
			setRecording(true);
			setLoading(false);
		} catch (err) {
			console.log(err);
			setLoading(false);
		}
	};

	const handleUploadAudio = async () => {
		setLoading(true);
		try {
			const [, blob] = await Mp3Recorder.stop().getMp3();
			if (blob.size < 10000) {
				setLoading(false);
				setRecording(false);
				return;
			}

			const formData = new FormData();
			const filename = `${new Date().getTime()}.mp3`;
			formData.append("medias", blob, filename);
			formData.append("body", filename);
			formData.append("fromMe", true);

			await api.post(`/messages/${ticketId}`, formData);
		} catch (err) {
			const errorMsg = err.response?.data?.error;
			if (errorMsg) {
				if (i18n.exists(`backendErrors.${errorMsg}`)) {
					toast.error(i18n.t(`backendErrors.${errorMsg}`));
				} else {
					toast.error(err.response.data.error);
				}
			} else {
				toast.error("Unknown error");
			}
		}

		setRecording(false);
		setLoading(false);
	};

	const handleCancelAudio = async () => {
		try {
			await Mp3Recorder.stop().getMp3();
			setRecording(false);
		} catch (err) {
			console.log(err);
		}
	};

	const renderQuotedMessage = message => {
		return (
			<div className={classes.quotedMsgWrapper}>
				<div className={classes.quotedContainer}>
					<span
						className={clsx(classes.quotedSideOther, {
							[classes.quotedSideMine]: !message.fromMe,
						})}
					></span>
					<div className={classes.quotedMsgBody}>
						{!message.fromMe && (
							<span className={classes.messageContactName}>
								{message.contact?.name}
							</span>
						)}
						{message.body}
					</div>
				</div>
				<IconButton
					aria-label="showRecorder"
					component="span"
					disabled={loading || ticketStatus !== "open"}
					onClick={() => setReplyingMessage({})}
				>
					<ClearIcon className={classes.sendMessageIcons} />
				</IconButton>
			</div>
		);
	};

	if (medias.length > 0)
		return (
			<Paper elevation={0} square className={classes.viewMediaInputWrapper}>
				<IconButton
					aria-label="cancel-upload"
					component="span"
					onClick={e => setMedias([])}
				>
					<CancelIcon className={classes.sendMessageIcons} />
				</IconButton>

				{loading ? (
					<div>
						<CircularProgress className={classes.circleLoading} />
					</div>
				) : (
					<span>
						{medias[0]?.name}
						{/* <img src={media.preview} alt=""></img> */}
					</span>
				)}
				<IconButton
					aria-label="send-upload"
					component="span"
					onClick={handleUploadMedia}
					disabled={loading}
				>
					<SendIcon className={classes.sendMessageIcons} />
				</IconButton>
			</Paper>
		);
	else {
		return (
			<Paper square elevation={0} className={classes.mainWrapper}>
				{replyingMessage.id && renderQuotedMessage(replyingMessage)}
				<div className={classes.newMessageBox}>
					<IconButton
						aria-label="emojiPicker"
						component="span"
						disabled={loading || recording || ticketStatus !== "open"}
						onClick={e => setShowEmoji(prevState => !prevState)}
					>
						<MoodIcon className={classes.sendMessageIcons} />
					</IconButton>
					{showEmoji ? (
						<div className={classes.emojiBox}>
							<Picker
								perLine={16}
								showPreview={false}
								showSkinTones={false}
								onSelect={handleAddEmoji}
							/>
						</div>
					) : null}

					<input
						multiple
						type="file"
						id="upload-button"
						disabled={loading || recording || ticketStatus !== "open"}
						className={classes.uploadInput}
						onChange={handleChangeMedias}
					/>
					<label htmlFor="upload-button">
						<IconButton
							aria-label="upload"
							component="span"
							disabled={loading || recording || ticketStatus !== "open"}
						>
							<AttachFileIcon className={classes.sendMessageIcons} />
						</IconButton>
					</label>
					<div className={classes.messageInputWrapper}>
						<InputBase
							inputRef={input => input && input.focus()}
							className={classes.messageInput}
							placeholder={
								ticketStatus === "open"
									? i18n.t("messagesInput.placeholderOpen")
									: i18n.t("messagesInput.placeholderClosed")
							}
							multiline
							rowsMax={5}
							value={inputMessage}
							onChange={handleChangeInput}
							disabled={recording || loading || ticketStatus !== "open"}
							onPaste={e => {
								ticketStatus === "open" && handleInputPaste(e);
							}}
							onKeyPress={e => {
								if (loading || e.shiftKey) return;
								else if (e.key === "Enter") {
									handleSendMessage();
								}
							}}
						/>
					</div>
					{inputMessage ? (
						<IconButton
							aria-label="sendMessage"
							component="span"
							onClick={handleSendMessage}
							disabled={loading}
						>
							<SendIcon className={classes.sendMessageIcons} />
						</IconButton>
					) : recording ? (
						<div className={classes.recorderWrapper}>
							<IconButton
								aria-label="cancelRecording"
								component="span"
								fontSize="large"
								disabled={loading}
								onClick={handleCancelAudio}
							>
								<HighlightOffIcon className={classes.cancelAudioIcon} />
							</IconButton>
							{loading ? (
								<div>
									<CircularProgress className={classes.audioLoading} />
								</div>
							) : (
								<RecordingTimer />
							)}

							<IconButton
								aria-label="sendRecordedAudio"
								component="span"
								onClick={handleUploadAudio}
								disabled={loading}
							>
								<CheckCircleOutlineIcon className={classes.sendAudioIcon} />
							</IconButton>
						</div>
					) : (
						<IconButton
							aria-label="showRecorder"
							component="span"
							disabled={loading || ticketStatus !== "open"}
							onClick={handleStartRecording}
						>
							<MicIcon className={classes.sendMessageIcons} />
						</IconButton>
					)}
				</div>
			</Paper>
		);
	}
};

export default MessageInput;
