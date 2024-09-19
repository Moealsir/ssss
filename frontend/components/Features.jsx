export default function Features() {
    return (
        <section className="bg-gray-100" id="Features">
            <div className="container px-6 py-10 mx-auto">
                <div className="flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-semibold text-gray-800 capitalize lg:text-3xl dark:text-gray-800">Our Features</h1>

                    <div className="mt-2">
                        <span className="inline-block w-40 h-1 bg-malachite-500 rounded-full"></span>
                        <span className="inline-block w-3 h-1 ml-1 bg-malachite-500 rounded-full"></span>
                        <span className="inline-block w-1 h-1 ml-1 bg-malachite-500 rounded-full"></span>
                    </div>
                </div>

                <div className="mt-8 xl:mt-12 lg:flex lg:items-center">
                    <div className="grid w-full grid-cols-1 gap-8 lg:w-1/2 xl:gap-16 md:grid-cols-2">
                        <div className="space-y-3">
                            <span className="inline-block p-3 text-malachite-500 bg-blue-100 rounded-xl dark:text-white dark:bg-malachite-500">
                            <svg
                                viewBox="0 0 1024 1024"
                                fill="currentColor"
                                height="2em"
                                width="2em"
                                >
                                <defs>
                                    <style />
                                </defs>
                                <path d="M945 412H689c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h256c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM811 548H689c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h122c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM477.3 322.5H434c-6.2 0-11.2 5-11.2 11.2v248c0 3.6 1.7 6.9 4.6 9l148.9 108.6c5 3.6 12 2.6 15.6-2.4l25.7-35.1v-.1c3.6-5 2.5-12-2.5-15.6l-126.7-91.6V333.7c.1-6.2-5-11.2-11.1-11.2z" />
                                <path d="M804.8 673.9H747c-5.6 0-10.9 2.9-13.9 7.7-12.7 20.1-27.5 38.7-44.5 55.7-29.3 29.3-63.4 52.3-101.3 68.3-39.3 16.6-81 25-124 25-43.1 0-84.8-8.4-124-25-37.9-16-72-39-101.3-68.3s-52.3-63.4-68.3-101.3c-16.6-39.2-25-80.9-25-124 0-43.1 8.4-84.7 25-124 16-37.9 39-72 68.3-101.3 29.3-29.3 63.4-52.3 101.3-68.3 39.2-16.6 81-25 124-25 43.1 0 84.8 8.4 124 25 37.9 16 72 39 101.3 68.3 17 17 31.8 35.6 44.5 55.7 3 4.8 8.3 7.7 13.9 7.7h57.8c6.9 0 11.3-7.2 8.2-13.3-65.2-129.7-197.4-214-345-215.7-216.1-2.7-395.6 174.2-396 390.1C71.6 727.5 246.9 903 463.2 903c149.5 0 283.9-84.6 349.8-215.8 3.1-6.1-1.4-13.3-8.2-13.3z" />
                                </svg>
                            </span>

                            <h1 className="text-xl font-semibold text-gray-700 capitalize dark:gray-700">Real-Time Alerts</h1>

                            <p className="text-gray-500 dark:text-gray-500">
                            Never miss an important email again. Receive instant WhatsApp notifications the moment a new email arrives, ensuring you're always in the loop.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <span className="inline-block p-3 text-malachite-500 bg-blue-100 rounded-xl dark:text-white dark:bg-malachite-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </span>

                            <h1 className="text-xl font-semibold text-gray-700 capitalize dark:gray-700">AI-Powered Email Summaries</h1>

                            <p className="text-gray-500 dark:text-gray-500">
                            Overwhelmed by long emails? Let our AI module summarize lengthy emails into concise, easy-to-read WhatsApp messages, giving you key insights at a glance.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <span className="inline-block p-3 text-malachite-500 bg-blue-100 rounded-xl dark:text-white dark:bg-malachite-500">
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                height="2em"
                                width="2em"
                                >
                                <path fill="none" d="M0 0h24v24H0z" />
                                <path d="M15.936 2.5L21.5 8.067v7.87L15.936 21.5h-7.87L2.5 15.936v-7.87L8.066 2.5h7.87zm-.829 2H8.894L4.501 8.895v6.213l4.393 4.394h6.213l4.394-4.394V8.894l-4.394-4.393zM11 15h2v2h-2v-2zm0-8h2v6h-2V7z" />
                                </svg>
                            </span>

                            <h1 className="text-xl font-semibold text-gray-700 capitalize dark:text-gray-700">Spam Detection</h1>

                            <p className="text-gray-500 dark:text-gray-500">
                            <br />Stay safe from unwanted emails. Our system automatically flags and filters out potential spam, sending only the genuine, important emails to your WhatsApp.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <span className="inline-block p-3 text-malachite-500 bg-blue-100 rounded-xl dark:text-white dark:bg-malachite-500">
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                height="2em"
                                width="2em"
                                >
                                <path d="M20 8l-8 5-8-5V6l8 5 8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                                </svg>
                            </span>

                            <h1 className="text-xl font-semibold text-gray-700 capitalize dark:text-gray-700">Seamless Integration with Multiple Email Providers</h1>

                            <p className="text-gray-500 dark:text-gray-500">
                            Whether you're using Gmail, Outlook, or any other email provider, our platform connects seamlessly, delivering email notifications straight to your WhatsApp with zero hassle.
                            </p>
                        </div>
                    </div>

                    <div className="hidden lg:flex lg:w-1/2 lg:justify-center">
                        <img className="w-[28rem] h-[28rem] flex-shrink-0 object-cover xl:w-[34rem] xl:h-[34rem] rounded-full" src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" alt=""/>
                    </div>
                </div>
            </div>
        </section>
    );
}