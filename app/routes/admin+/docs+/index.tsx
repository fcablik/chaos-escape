export default function AdminIndex() {
	return (
		<div className="py-2 md:py-6">
			<div className="mb-8 px-2 max-sm:text-center md:px-6">
				<h2 className="mb-2 text-h2 capitalize text-foreground">
					Chaos Escape Documentation
				</h2>
				<p className="text-xl">
					Here, You will find all necessary information to operate this
					application.
				</p>
			</div>

			<div className="flex flex-row flex-wrap p-2 md:p-6">
                <div className='mb-8'>
                    <h3 className='text-lg underline capitalize mb-4'>html templates to use in descriptions</h3>
                    <div className='flex flex-col gap-2'>
                        <p>
                            <strong className='capitalize'>titles:{' '}</strong>
                            <br/>
                            &lt;h2&gt;title&lt;/h2&gt;
                        </p>

                        <p>
                            <strong className='capitalize'>sub-titles:{' '}</strong>
                            <br/>
                            &lt;h3&gt;sub-title&lt;/h3&gt;
                        </p>

                        <p>
                            <strong className='capitalize'>paragraphs:{' '}</strong>
                            <br/>
                            &lt;p&gt;text&lt;/p&gt;
                        </p>

                        <p>
                            <strong className='capitalize'>images:{' '}</strong>
                            <br/>
                            &lt;img src="" alt="" draggable="false" loading="lazy" &gt;
                        </p>
                    </div>
                </div>
			</div>
		</div>
	)
}
