import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, List } from 'antd';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import hljs from "highlight.js";
import gfm from 'remark-gfm';
import './Chat.css'
// 引入 highlight.js 的样式文件
import "highlight.js/styles/monokai-sublime.css";

const TextArea = Input.TextArea

const CodeBlock = ({ language, value }) => {
  return (
    <div className="highlight">
      <pre>
        <code
          className={language}
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(value, { language }).value,
          }}
        />
      </pre>
    </div>
  );
};

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false)
  const lastItemRef = useRef()

  useEffect(() => {
    hljs.initHighlightingOnLoad()
    setTimeout(() => {
      console.log(lastItemRef.current)
      lastItemRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }, [chatLog.length])

  const handleInput = (e) => {
    setInputValue(e.target.value);
  };

  const handleSend = async (e) => {
    e.preventDefault()
    if (inputValue.trim() === '') return
    chatLog.push({ type: 'user', text: inputValue })
    setChatLog([...chatLog]);
    setLoading(true)
    setInputValue('');
    let res
    try {
      res = await axios.post('/api/chat', { message: inputValue })
    } finally {
      chatLog.push({ type: 'bot', text: res.data?.content })
      setChatLog([...chatLog]);
      setLoading(false)
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      setInputValue(`${inputValue}\n`);
      return
    }
    if (e.key === 'Enter') {
      handleSend(e)
    }
  };

  return (
    <div>
      {
        chatLog.length ? 
          <List
            className='list-container'
            dataSource={chatLog}
            renderItem={(item, index) => (
              <List.Item style={{ float: item.type === 'user' ? 'right' : 'left' }}>
                <div style={{ backgroundColor: item.type === 'user' ? '#1890ff' : '#f0f0f0', color: item.type === 'user' ? '#fff' : '#000' }}
                  className='list-item'
                  ref={index === chatLog.length - 1 ? lastItemRef : null}
                >
                  <ReactMarkdown remarkPlugins={[gfm]} children={item.text} renderers={{ code: CodeBlock }} />
                </div>
              </List.Item>
            )}
          /> : null
      }
      <div className='fixed-bottom-area'>
        <div className='input-container'>
          <TextArea value={inputValue} onChange={handleInput} style={{ flex: 1 }} onKeyDown={handleKeyDown} autoSize={{ maxRows: 50 }} autoFocus={true} />
          <Button type="primary" loading={loading} onClick={handleSend} style={{ marginLeft: 20 }}>
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;