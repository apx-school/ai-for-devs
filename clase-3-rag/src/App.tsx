import { useEffect, useRef, useState } from 'react'
import styles from "./App.module.css"
import Markdown from 'react-markdown';

function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function pullMessages() {
    const response = await fetch("/api/messages");

    const data = await response.json();
    setMessages(data);
    goDown();
  }

  function goDown(delay = 600) {
    setTimeout(() => {
      ref.current?.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }, delay)
  }

  useEffect(() => {
    pullMessages();
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = e.currentTarget.message.value;
    const newMessage = {
      role: "user",
      content,
    }
    setMessages([...messages, newMessage]);
    goDown();
    e.currentTarget.reset()

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMessage),
    });

    pullMessages();
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.currentTarget.files) {
      return;
    }

    const form = new FormData();
    form.append("files", e.currentTarget.files[0]);

    fetch("/files/index", {
      method: "POST",
      body: form,
    }).then(() => {
      e.currentTarget.value = "";
    })
  }

  return (
    <>
      <div className={styles.root}>
        <input type="file" className={styles.fileInput} onChange={onFileInputChange} />
        <div className={styles.messages} ref={ref}>
          {messages.map((m, index) => (
            <div key={index} className={styles.message + " " + m.role}>
              <Markdown>{m.content}</Markdown>
            </div>
          ))}

        </div>
        <form className={styles.inputContainer} onSubmit={handleSubmit}>
          <input type="text" className={styles.input} name="message" />
          <button className={styles.button}>Enviar</button>
        </form>
      </div>
    </>
  )
}

export default App
